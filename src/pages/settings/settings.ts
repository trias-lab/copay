import { Component } from '@angular/core';
// import { TranslateService } from '@ngx-translate/core';
import { NavController } from 'ionic-angular';
import { Logger } from '../../providers/logger/logger';

// providers
import { ConfigProvider } from '../../providers/config/config';
// import { ExternalLinkProvider } from '../../providers/external-link/external-link';
import { LanguageProvider } from '../../providers/language/language';
import { PlatformProvider } from '../../providers/platform/platform';
import { PopupProvider } from '../../providers/popup/popup';
import { ProfileProvider } from '../../providers/profile/profile';
import { TouchIdProvider } from '../../providers/touchid/touchid';

// pages
// import { AboutPage } from './about/about';
import { AddressbookPage } from './addressbook/addressbook';
// import { AdvancedPage } from './advanced/advanced';
import { AltCurrencyPage } from './alt-currency/alt-currency';
import { FeePolicyPage } from './fee-policy/fee-policy';
import { LanguagePage } from './language/language';
// import { NotificationsPage } from './notifications/notifications';
// import { SharePage } from './share/share';

@Component({
  selector: 'page-settings',
  templateUrl: 'settings.html'
})
export class SettingsPage {
  public appName: string;
  public currentLanguageName: string;
  public languages;
  public walletsBtc;
  public walletsBch;
  public config;
  public selectedAlternative;
  public isCordova: boolean;

  public pinLock;
  public fingerprintLock;

  constructor(
    private navCtrl: NavController,
    private language: LanguageProvider,
    // private externalLinkProvider: ExternalLinkProvider,
    private profileProvider: ProfileProvider,
    private configProvider: ConfigProvider,
    private logger: Logger,
    private platformProvider: PlatformProvider,
    // private translate: TranslateService,
    private touchid: TouchIdProvider,
    private popupProvider: PopupProvider
  ) {
    this.appName = 'TRY Wallet';
    this.walletsBch = [];
    this.walletsBtc = [];
    this.isCordova = this.platformProvider.isCordova;
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: SettingsPage');
  }

  ionViewWillEnter() {
    this.currentLanguageName = this.language.getName(
      this.language.getCurrent()
    );
    this.walletsBtc = this.profileProvider.getWallets({
      coin: 'btc'
    });
    this.walletsBch = this.profileProvider.getWallets({
      coin: 'bch'
    });
    this.config = this.configProvider.get();
    this.selectedAlternative = {
      name: this.config.wallet.settings.alternativeName,
      isoCode: this.config.wallet.settings.alternativeIsoCode
    };

    this.checkFingerprintLock();
  }

  public openAltCurrencyPage(): void {
    this.navCtrl.push(AltCurrencyPage);
  }

  public openLanguagePage(): void {
    this.navCtrl.push(LanguagePage);
  }

  // public openAdvancedPage(): void {
  //   this.navCtrl.push(AdvancedPage);
  // }

  // public openAboutPage(): void {
  //   this.navCtrl.push(AboutPage);
  // }

  public resetEncryptPassword(): void {
    this.profileProvider.resetEncryptPassword().then(() => {
      this.popupProvider.ionicAlert(
        'Your encrypt password is updated successfully!'
      );
    });
  }

  /**
   * Enable or disable TouchID.
   * Check TouchID before enable the option.
   */
  public toggleFingerprint(): void {
    let lock = this.configProvider.get().lock;
    if (!this.fingerprintLock.enabled) {
      lock.fingerprint = null;
      this.configProvider.set({ lock });
    } else {
      // check touchid before enable the option
      this.touchid
        .check()
        .then(() => {
          lock.fingerprint = this.fingerprintLock.label;
          this.configProvider.set({ lock });
        })
        .catch(() => {
          this.fingerprintLock.enabled = false;
        });
    }
  }

  /**
   * Check if TouchID is available.
   */
  private checkFingerprintLock() {
    let lockOptions = this.configProvider.get().lock;
    // let needsBackup = this.needsBackup();
    this.touchid.isAvailable().then((type: any) => {
      if (type) {
        this.fingerprintLock = {
          label: type == 'touch' ? 'Touch ID' : 'Face ID',
          enabled: lockOptions.fingerprint !== null
          // disabled: needsBackup
        };
      }
    });
  }

  // private needsBackup() {
  //   let wallets = this.profileProvider.getWallets();
  //   let singleLivenetWallet =
  //     wallets.length == 1 &&
  //     wallets[0].network == 'livenet' &&
  //     wallets[0].needsBackup;
  //   let atLeastOneLivenetWallet = _.find(wallets, w => {
  //     return w.network == 'livenet' && w.needsBackup;
  //   });

  //   if (singleLivenetWallet) {
  //     this.needsBackupMsg = this.translate.instant(
  //       'Back up your wallet before using this function'
  //     );
  //     return true;
  //   } else if (atLeastOneLivenetWallet) {
  //     this.needsBackupMsg = this.translate.instant(
  //       'Back up all your wallets before using this function'
  //     );
  //     return true;
  //   } else {
  //     this.needsBackupMsg = null;
  //     return false;
  //   }
  // }

  public openAddressBookPage(): void {
    this.navCtrl.push(AddressbookPage);
  }

  // public openNotificationsPage(): void {
  //   this.navCtrl.push(NotificationsPage);
  // }

  public openFeePolicyPage(): void {
    this.navCtrl.push(FeePolicyPage);
  }

  // public openSharePage(): void {
  //   this.navCtrl.push(SharePage);
  // }

  // public openHelpExternalLink(): void {
  //   let url =
  //     this.appName == 'Copay'
  //       ? 'https://github.com/bitpay/copay/issues'
  //       : 'https://help.bitpay.com/bitpay-app';
  //   let optIn = true;
  //   let title = null;
  //   let message = this.translate.instant(
  //     'Help and support information is available at the website.'
  //   );
  //   let okText = this.translate.instant('Open');
  //   let cancelText = this.translate.instant('Go Back');
  //   this.externalLinkProvider.open(
  //     url,
  //     optIn,
  //     title,
  //     message,
  //     okText,
  //     cancelText
  //   );
  // }
}
