import { Component } from '@angular/core';
// import { TranslateService } from '@ngx-translate/core';
import { NavController, NavParams } from 'ionic-angular';
import { Observable } from 'rxjs';
// import { Logger } from '../../providers/logger/logger';

// Native
import { SocialSharing } from '@ionic-native/social-sharing';

// Pages
import { BackupRequestPage } from '../backup/backup-request/backup-request';
// import { AmountPage } from '../send/amount/amount';

// Providers
import { ActionSheetProvider } from '../../providers/action-sheet/action-sheet';
// import { AddressProvider } from '../../providers/address/address';
// import { BwcErrorProvider } from '../../providers/bwc-error/bwc-error';
// import { ExternalLinkProvider } from '../../providers/external-link/external-link';
import { PlatformProvider } from '../../providers/platform/platform';
import { ProfileProvider } from '../../providers/profile/profile';
import { WalletProvider } from '../../providers/wallet/wallet';

// import * as _ from 'lodash';
import { WalletTabsChild } from '../wallet-tabs/wallet-tabs-child';
import { WalletTabsProvider } from '../wallet-tabs/wallet-tabs.provider';

@Component({
  selector: 'page-receive',
  templateUrl: 'receive.html'
})
export class ReceivePage extends WalletTabsChild {
  public protocolHandler: string;
  public address: string;
  public qrAddress: string;
  public wallets = [];
  public wallet;
  public showShareButton: boolean;
  public loading: boolean;
  public playAnimation: boolean;

  // private onResumeSubscription: Subscription;

  constructor(
    private actionSheetProvider: ActionSheetProvider,
    navCtrl: NavController,
    private navParams: NavParams,
    // private logger: Logger,
    profileProvider: ProfileProvider,
    private walletProvider: WalletProvider,
    private platformProvider: PlatformProvider,
    // private events: Events,
    private socialSharing: SocialSharing,
    // private bwcErrorProvider: BwcErrorProvider,
    // private translate: TranslateService,
    // private externalLinkProvider: ExternalLinkProvider,
    // private addressProvider: AddressProvider,
    walletTabsProvider: WalletTabsProvider
    // private platform: Platform
  ) {
    super(navCtrl, profileProvider, walletTabsProvider);
    this.showShareButton = this.platformProvider.isCordova;
    this.address = this.navParams.get('address');
  }

  ionViewWillEnter() {
    this.updateQrAddress(this.address);
  }

  // public requestSpecificAmount(): void {
  //   this.navCtrl.push(AmountPage, {
  //     toAddress: this.address,
  //     id: this.wallet.credentials.walletId,
  //     recipientType: 'wallet',
  //     name: this.wallet.name,
  //     color: this.wallet.color,
  //     coin: this.wallet.coin,
  //     nextPage: 'CustomAmountPage',
  //     network: this.addressProvider.getNetwork(this.address)
  //   });
  // }

  private async updateQrAddress(address?): Promise<void> {
    let qrAddress = this.walletProvider.getProtoAddress(this.wallet, address);
    this.address = address;
    this.qrAddress = qrAddress;
    await Observable.timer(200).toPromise();
    this.playAnimation = false;
  }

  public shareAddress(): void {
    if (!this.showShareButton) return;
    this.socialSharing.share(this.address);
  }

  public goToBackup(): void {
    this.navCtrl.push(BackupRequestPage, {
      walletId: this.wallet.credentials.walletId
    });
  }

  public showFullAddr(): void {
    const infoSheet = this.actionSheetProvider.createInfoSheet(
      'address-copied',
      { address: this.address, coin: this.wallet.coin }
    );
    infoSheet.present();
  }
}
