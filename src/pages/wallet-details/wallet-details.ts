import { Component } from '@angular/core';
import { StatusBar } from '@ionic-native/status-bar';
import { TranslateService } from '@ngx-translate/core';
import {
  Events,
  ModalController,
  NavController,
  NavParams,
  Platform
} from 'ionic-angular';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';

// providers
import { AddressBookProvider } from '../../providers/address-book/address-book';
import { AddressManagerProvider } from '../../providers/address-manager/address-manager';
import { BwcErrorProvider } from '../../providers/bwc-error/bwc-error';
import { ExternalLinkProvider } from '../../providers/external-link/external-link';
import { ActionSheetProvider } from '../../providers/index';
import { Logger } from '../../providers/logger/logger';
import { OnGoingProcessProvider } from '../../providers/on-going-process/on-going-process';
import { PopupProvider } from '../../providers/popup/popup';
import { ProfileProvider } from '../../providers/profile/profile';
import { TimeProvider } from '../../providers/time/time';
import { WalletProvider } from '../../providers/wallet/wallet';

// pages
import { BackupRequestPage } from '../../pages/backup/backup-request/backup-request';
import { WalletAddressesPage } from '../../pages/settings/wallet-settings/wallet-settings-advanced/wallet-addresses/wallet-addresses';
import { TxDetailsPage } from '../../pages/tx-details/tx-details';
import { GiftCardProvider } from '../../providers/gift-card/gift-card';
import { ReceivePage } from '../receive/receive';
import { SendPage } from '../send/send';
import { WalletSettingsPage } from '../settings/wallet-settings/wallet-settings';
import { WalletTabsChild } from '../wallet-tabs/wallet-tabs-child';
import { WalletTabsProvider } from '../wallet-tabs/wallet-tabs.provider';
import { AddressAddPage } from './add-address/add-address';
import { SearchTxModalPage } from './search-tx-modal/search-tx-modal';
import { WalletBalancePage } from './wallet-balance/wallet-balance';

const HISTORY_SHOW_LIMIT = 10;

@Component({
  selector: 'page-wallet-details',
  templateUrl: 'wallet-details.html'
})
export class WalletDetailsPage extends WalletTabsChild {
  private currentPage: number = 0;
  private showBackupNeededMsg: boolean = true;
  private onResumeSubscription: Subscription;
  private analyzeUtxosDone: boolean;
  private addressStored;
  private addressToAdd;

  public requiresMultipleSignatures: boolean;
  public wallet;
  public history = [];
  public groupedHistory = [];
  public walletNotRegistered: boolean;
  public updateError: boolean;
  public updateStatusError;
  public updatingStatus: boolean;
  public updatingTxHistory: boolean;
  public updateTxHistoryError: boolean;
  public updatingTxHistoryProgress: number = 0;
  public showNoTransactionsYetMsg: boolean;
  public showBalanceButton: boolean = false;
  public addressbook = {};
  public lowUtxosWarning: boolean;
  public txps = [];
  public selectedTab: string; // transactions or addresses

  public address: string; // current address
  // public allAddresses; // list of addresses generated
  public loadingAddr: boolean; // whether loading addresses
  public noBalance; // addresses without balance
  public withBalance; // addresses with balance
  // public latestUnused;  // addresses unused latest
  // public latestWithBalance;  // addresses latest with balance
  public editingAddr: boolean;

  constructor(
    navCtrl: NavController,
    private navParams: NavParams,
    profileProvider: ProfileProvider,
    private walletProvider: WalletProvider,
    private addressbookProvider: AddressBookProvider,
    private bwcError: BwcErrorProvider,
    private popupProvider: PopupProvider,
    private events: Events,
    public giftCardProvider: GiftCardProvider,
    private logger: Logger,
    private timeProvider: TimeProvider,
    private translate: TranslateService,
    private modalCtrl: ModalController,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private externalLinkProvider: ExternalLinkProvider,
    walletTabsProvider: WalletTabsProvider,
    private actionSheetProvider: ActionSheetProvider,
    private platform: Platform,
    private statusBar: StatusBar,
    private am: AddressManagerProvider
  ) {
    super(navCtrl, profileProvider, walletTabsProvider);
    this.selectedTab = 'transactions'; // transactions or addresses
    this.withBalance = null;
    this.noBalance = null;
    // this.allAddresses = null;
    this.editingAddr = false;
    this.addressToAdd = null;
  }

  ionViewDidLoad() {
    this.events.subscribe('Wallet/updateAll', (opts?) => {
      this.updateAll(opts);
    });

    if (this.wallet.needsBackup && this.showBackupNeededMsg) {
      this.openBackupModal();
    } else {
      this.setAddress();
    }

    this.events.subscribe('Wallet/setAddress', (newAddr?: boolean) => {
      this.setAddress(newAddr);
    });

    // Getting info from cache
    if (this.navParams.data.clearCache) {
      this.clearHistoryCache();
    } else {
      this.wallet.status = this.wallet.cachedStatus;
      if (this.wallet.completeHistory) this.showHistory();
    }

    this.requiresMultipleSignatures = this.wallet.credentials.m > 1;

    this.addressbookProvider
      .list()
      .then(ab => {
        this.addressbook = ab;
      })
      .catch(err => {
        this.logger.error(err);
      });
  }

  ionViewWillEnter() {
    // set status bar style
    if (this.platform.is('ios')) {
      this.statusBar.styleLightContent();
    }

    // The resume event emits when the native platform pulls the application out from the background.
    this.onResumeSubscription = this.platform.resume.subscribe(() => {
      this.updateAll();
      this.events.subscribe('Wallet/updateAll', (opts?) => {
        this.updateAll(opts);
      });

      this.setAddress();
      this.events.subscribe('Wallet/setAddress', (newAddr?: boolean) => {
        this.setAddress(newAddr);
      });
    });
  }

  ionViewDidEnter() {
    this.updateAll();
  }

  ionViewWillLeave() {
    // reset status bar style
    if (this.platform.is('ios')) {
      this.statusBar.styleDefault();
    }
    this.onResumeSubscription.unsubscribe();
  }

  /**
   * handle the change of tabs
   * @param {string} tab transactions or addresses
   */
  selectTab(tab: string) {
    this.selectedTab = tab; // update the tab

    // switch (tab) {
    //   case 'transactions':
    //     this.updateTxHistory();
    //     break;
    //   case 'addresses':
    //     this.updateAddresses();
    //     break;
    //   default:
    //     break;
    // }
  }

  shouldShowZeroState() {
    return this.showNoTransactionsYetMsg && !this.updateStatusError;
  }

  shouldShowSpinner() {
    return (
      (this.updatingStatus || this.updatingTxHistory) &&
      !this.walletNotRegistered &&
      !this.updateStatusError &&
      !this.updateTxHistoryError
    );
  }

  goToPreferences() {
    this.navCtrl.push(WalletSettingsPage, { walletId: this.wallet.id });
  }

  createAddress() {
    this.navCtrl.push(AddressAddPage, { walletId: this.wallet.id });
  }

  editAddressName(addr: string, name: string) {
    this.navCtrl.push(AddressAddPage, {
      walletId: this.wallet.id,
      edit: true,
      addressToEdit: addr,
      oldName: name
    });
  }

  /**
   * When address manager in local storage is empty, call this function
   * to add all addresses in the list this.addressToAdd to local storage.
   */
  private addAllAddress() {
    let addressItem = this.addressToAdd.pop();
    if (addressItem) {
      let addr = this.walletProvider.getAddressView(
        this.wallet,
        addressItem.address
      );
      this.am
        .add(this.wallet, { name: 'Default', address: addr })
        .then(() => {
          this.logger.debug('----Add address ' + addr + 'to wallet manager');
          this.addAllAddress();
        })
        .catch(err => {
          this.logger.debug(err + ': Address ' + addr);
        });
    }
  }

  /**
   * Set current address
   * @param  {boolean}       newAddr whether generate a new address
   */
  private async setAddress(newAddr?: boolean): Promise<void> {
    this.loadingAddr = newAddr || _.isEmpty(this.address);

    let addr: string = (await this.walletProvider
      .getAddress(this.wallet, newAddr)
      .catch(err => {
        this.loadingAddr = false;
        this.logger.warn(this.bwcError.msg(err, 'Server Error'));
      })) as string;
    this.loadingAddr = false;

    let addressView = this.walletProvider.getAddressView(this.wallet, addr);

    if (this.address && this.address != addressView) {
      // do something when coin is bch
    }

    //  If address manager is empty, or do not contain this address, add this address into it.
    this.am.list(this.wallet).then(am => {
      // If the address is new and not stored in local address-manager
      // update addresses stored in address-manager
      // if (_.isEmpty(am[addressView])) {
      this.walletProvider
        .getMainAddresses(this.wallet, {
          doNotVerify: true
        })
        .then(allAddresses => {
          // allAddresses only contains addresses with path 'm/0/...' but not 'm/1/...'.
          // so it should concat addresses with balance and no balance to get all addresses.
          this.walletProvider
            .getBalance(this.wallet, {})
            .then(resp => {
              let withBalance = resp.byAddress;

              let idx = _.keyBy(withBalance, 'address');
              let noBalance = _.reject(allAddresses, x => {
                return idx[x.address];
              });

              // contat address lists and exclude the addresses already stored in local
              let amx = _.keys(am);
              this.addressToAdd = _.reject(withBalance.concat(noBalance), x => {
                return amx.indexOf(x.address) !== -1;
              });

              this.addAllAddress();
              this.updateAddresses();
            })
            .catch(err => {
              this.logger.error(err);
              this.loadingAddr = false;
              this.popupProvider.ionicAlert(
                this.bwcError.msg(
                  err,
                  this.translate.instant('Could not update wallet')
                )
              );
            });
        });
      // }
    });
    this.address = addressView; // update curent address
  }

  private updateAddresses() {
    this.loadingAddr = true;
    this.editingAddr = false; // reset editing status

    this.walletProvider
      .getMainAddresses(this.wallet, {
        doNotVerify: true
      })
      .then(allAddresses => {
        this.walletProvider
          .getBalance(this.wallet, {})
          .then(resp => {
            this.withBalance = resp.byAddress;

            var idx = _.keyBy(this.withBalance, 'address');
            this.noBalance = _.reject(allAddresses, x => {
              return idx[x.address];
            });

            // set address name
            this.am
              .list(this.wallet)
              .then(am => {
                // get addresses stored in ADDRESS_MANAGER
                this.addressStored = am;

                // this.logger.warn('--------noBalance');
                // this.logger.warn(this.noBalance)
                // this.logger.warn('--------withBalance');
                // this.logger.warn(this.withBalance)

                this.processList(this.noBalance);
                this.processList(this.withBalance);

                // set names for addresses without balance
                if (this.noBalance.length > 0) {
                  _.each(this.noBalance, item => {
                    item['name'] = this.addressStored[item.address].name;
                  });
                }
                // set names for addresses with balance
                if (this.withBalance.length > 0) {
                  _.each(this.withBalance, item => {
                    item['name'] = this.addressStored[item.address].name;
                  });
                }

                // this.allAddresses =
                // this.latestUnused = _.slice(
                //   this.noBalance,
                //   0,
                //   this.UNUSED_ADDRESS_LIMIT
                // );
                // this.latestWithBalance = _.slice(
                //   this.withBalance,
                //   0,
                //   this.BALANCE_ADDRESS_LIMIT
                // );
                // this.viewAll =
                //   this.noBalance.length > this.UNUSED_ADDRESS_LIMIT ||
                //   this.withBalance.length > this.BALANCE_ADDRESS_LIMIT;

                this.loadingAddr = false;
              })
              .catch(err => {
                this.logger.error(err);
              });
          })
          .catch(err => {
            this.logger.error(err);
            this.loadingAddr = false;
            this.popupProvider.ionicAlert(
              this.bwcError.msg(
                err,
                this.translate.instant('Could not update wallet')
              )
            );
          });
      })
      .catch(err => {
        this.logger.error(err);
        this.loadingAddr = false;
        this.popupProvider.ionicAlert(
          this.bwcError.msg(
            err,
            this.translate.instant('Could not update wallet')
          )
        );
      });
  }

  private processList(list): void {
    _.each(list, n => {
      n.path = n.path ? n.path.replace(/^m/g, 'xpub') : null;
      n.address = this.walletProvider.getAddressView(this.wallet, n.address);
    });
  }

  private clearHistoryCache() {
    this.history = [];
    this.currentPage = 0;
  }

  private groupHistory(history) {
    return history.reduce((groups, tx, txInd) => {
      this.isFirstInGroup(txInd)
        ? groups.push([tx])
        : groups[groups.length - 1].push(tx);
      return groups;
    }, []);
  }

  private showHistory(loading?: boolean) {
    this.history = this.wallet.completeHistory.slice(
      0,
      (this.currentPage + 1) * HISTORY_SHOW_LIMIT
    );
    this.groupedHistory = this.groupHistory(this.history);
    if (loading) this.currentPage++;
  }

  private setPendingTxps(txps) {
    /* Uncomment to test multiple outputs */

    // var txp = {
    //   message: 'test multi-output',
    //   fee: 1000,
    //   createdOn: new Date() / 1000,
    //   outputs: [],
    //   wallet: $scope.wallet
    // };
    //
    // function addOutput(n) {
    //   txp.outputs.push({
    //     amount: 600,
    //     toAddress: '2N8bhEwbKtMvR2jqMRcTCQqzHP6zXGToXcK',
    //     message: 'output #' + (Number(n) + 1)
    //   });
    // };
    // lodash.times(15, addOutput);
    // txps.push(txp);
    this.txps = !txps ? [] : _.sortBy(txps, 'createdOn').reverse();
  }

  private updateTxHistory(opts) {
    this.updatingTxHistory = true;

    if (!opts.retry) {
      this.updateTxHistoryError = false;
      this.updatingTxHistoryProgress = 0;
    }

    const progressFn = ((_, newTxs) => {
      if (newTxs > 5) this.history = null;
      this.updatingTxHistoryProgress = newTxs;
    }).bind(this);

    this.walletProvider
      .getTxHistory(this.wallet, {
        progressFn,
        opts
      })
      .then(txHistory => {
        this.updatingTxHistory = false;
        this.updatingTxHistoryProgress = 0;

        const hasTx = txHistory[0];
        this.showNoTransactionsYetMsg = !hasTx;

        if (this.wallet.needsBackup && hasTx && this.showBackupNeededMsg)
          this.openBackupModal();

        this.wallet.completeHistory = txHistory;
        this.showHistory();
        if (!opts.retry) {
          this.events.publish('Wallet/updateAll', { retry: true }); // Workaround to refresh the view when the promise result is from a destroyed one
        }
      })
      .catch(err => {
        if (err != 'HISTORY_IN_PROGRESS') {
          this.updatingTxHistory = false;
          this.updateTxHistoryError = true;
        }
      });
  }

  private updateAll = _.debounce(
    (opts?) => {
      opts = opts || {};
      this.updateStatus(opts);
      this.updateTxHistory(opts);
      this.updateAddresses();
    },
    2000,
    {
      leading: true
    }
  );

  public toggleBalance() {
    this.profileProvider.toggleHideBalanceFlag(
      this.wallet.credentials.walletId
    );
  }

  public loadHistory(loading) {
    if (
      this.history &&
      this.wallet.completeHistory &&
      this.history.length === this.wallet.completeHistory.length
    ) {
      loading.complete();
      return;
    }
    setTimeout(() => {
      this.showHistory(true); // loading in true
      loading.complete();
    }, 300);
  }

  private analyzeUtxos(): void {
    if (this.analyzeUtxosDone) return;

    this.walletProvider
      .getLowUtxos(this.wallet)
      .then(resp => {
        if (!resp) return;
        this.analyzeUtxosDone = true;
        this.lowUtxosWarning = !!resp.warning;
        this.logger.debug('Low UTXOs warning: ', this.lowUtxosWarning);
      })
      .catch(err => {
        this.logger.warn('Analyze UTXOs: ', err);
      });
  }

  private updateStatus(opts) {
    this.updatingStatus = true;

    this.walletProvider
      .getStatus(this.wallet, opts)
      .then(status => {
        this.updatingStatus = false;
        this.setPendingTxps(status.pendingTxps);
        this.wallet.status = status;
        this.showBalanceButton =
          this.wallet.status.totalBalanceSat !=
          this.wallet.status.spendableAmount;
        this.analyzeUtxos();
        this.updateStatusError = null;
        this.walletNotRegistered = false;
      })
      .catch(err => {
        this.updatingStatus = false;
        this.showBalanceButton = false;
        if (err === 'WALLET_NOT_REGISTERED') {
          this.walletNotRegistered = true;
        } else {
          this.updateStatusError = this.bwcError.msg(
            err,
            this.translate.instant('Could not update wallet')
          );
        }
        this.wallet.status = null;
      });
  }

  public recreate() {
    this.onGoingProcessProvider.set('recreating');
    this.walletProvider
      .recreate(this.wallet)
      .then(() => {
        this.onGoingProcessProvider.clear();
        setTimeout(() => {
          this.walletProvider.startScan(this.wallet).then(() => {
            this.updateAll({ force: true });
          });
        });
      })
      .catch(err => {
        this.onGoingProcessProvider.clear();
        this.logger.error(err);
      });
  }

  public goToTxDetails(tx) {
    this.navCtrl.push(TxDetailsPage, {
      walletId: this.wallet.credentials.walletId,
      txid: tx.txid
    });
  }

  public openBackupModal(): void {
    this.showBackupNeededMsg = false;
    const infoSheet = this.actionSheetProvider.createInfoSheet(
      'backup-needed-with-activity'
    );
    infoSheet.present();
    infoSheet.onDidDismiss(option => {
      if (option) this.openBackup();
    });
  }

  public openBackup() {
    this.navCtrl.push(BackupRequestPage, {
      walletId: this.wallet.credentials.walletId
    });
  }

  public openAddresses() {
    this.navCtrl.push(WalletAddressesPage, {
      walletId: this.wallet.credentials.walletId
    });
  }

  public getDate(txCreated) {
    const date = new Date(txCreated * 1000);
    return date;
  }

  public trackByFn(index) {
    return index;
  }

  public isFirstInGroup(index) {
    if (index === 0) {
      return true;
    }
    const curTx = this.history[index];
    const prevTx = this.history[index - 1];
    return !this.createdDuringSameMonth(curTx, prevTx);
  }

  private createdDuringSameMonth(curTx, prevTx) {
    return this.timeProvider.withinSameMonth(
      curTx.time * 1000,
      prevTx.time * 1000
    );
  }

  public isDateInCurrentMonth(date) {
    return this.timeProvider.isDateInCurrentMonth(date);
  }

  public createdWithinPastDay(time) {
    return this.timeProvider.withinPastDay(time);
  }

  public isUnconfirmed(tx) {
    return !tx.confirmations || tx.confirmations === 0;
  }

  public openBalanceDetails(): void {
    this.navCtrl.push(WalletBalancePage, {
      status: this.wallet.status,
      color: this.wallet.color
    });
  }

  public back(): void {
    this.navCtrl.pop();
  }

  public openSearchModal(): void {
    const modal = this.modalCtrl.create(
      SearchTxModalPage,
      {
        addressbook: this.addressbook,
        completeHistory: this.wallet.completeHistory,
        wallet: this.wallet
      },
      { showBackdrop: false, enableBackdropDismiss: true }
    );
    modal.present();
    modal.onDidDismiss(data => {
      if (!data || !data.txid) return;
      this.navCtrl.push(TxDetailsPage, {
        walletId: this.wallet.credentials.walletId,
        txid: data.txid
      });
    });
  }

  public openExternalLink(url: string): void {
    const optIn = true;
    const title = null;
    const message = this.translate.instant(
      'Help and support information is available at the website.'
    );
    const okText = this.translate.instant('Open');
    const cancelText = this.translate.instant('Go Back');
    this.externalLinkProvider.open(
      url,
      optIn,
      title,
      message,
      okText,
      cancelText
    );
  }

  public doRefresh(refresher) {
    this.updateAll({ force: true });
    setTimeout(() => {
      refresher.complete();
    }, 2000);
  }

  public receive() {
    this.navCtrl.push(ReceivePage, {
      walletId: this.wallet.credentials.walletId,
      address: this.address
    });
  }

  public send() {
    this.navCtrl.push(SendPage, {
      walletId: this.wallet.credentials.walletId,
      address: this.address,
      coin: this.wallet.coin
    });
  }
}
