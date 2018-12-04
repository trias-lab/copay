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
    walletTabsProvider: WalletTabsProvider,
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
  //     network: this.addressProvider.validateAddress(this.address).network
  //   });
  // }

  private async updateQrAddress(address?): Promise<void> {
    let qrAddress = await this.walletProvider.getProtoAddress(
      this.wallet,
      address
    );
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

  public showMoreOptions(): void {
    const showShare =
      this.showShareButton &&
      this.wallet &&
      this.wallet.isComplete() &&
      !this.wallet.needsBackup;
    const optionsSheet = this.actionSheetProvider.createOptionsSheet(
      'address-options',
      { showShare }
    );
    optionsSheet.present();

    optionsSheet.onDidDismiss(option => {
      // if (option == 'request-amount') this.requestSpecificAmount();
      if (option == 'share-address') this.shareAddress();
    });
    if (!this.showShareButton) return;
    this.shareAddress();

    // const qrcode =
    //   '<div><ngx-qrcode  hide-toast="true" qrc-value="{{qrAddress}}"  qrc-errorCorrectionLevel="M"></ngx-qrcode></div>';

    // var canvas = document.createElement('canvas');
    // canvas.style.border = 'solid 1px red';
    // canvas.id = 'canvas';
    // canvas.style.width = '100%';
    // canvas.style.height = '100%';
    // this.socialSharing.share(this.address, 'text', '../');
  }

  public showFullAddr(): void {
    const infoSheet = this.actionSheetProvider.createInfoSheet(
      'address-copied',
      { address: this.address, coin: this.wallet.coin }
    );
    infoSheet.present();
  }
}
