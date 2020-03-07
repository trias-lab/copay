import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NavController } from 'ionic-angular';
import { Logger } from '../../providers/logger/logger';

// pages
import { ImportWalletPage } from '../add/import-wallet/import-wallet';
import { BackupRequestPage } from '../backup/backup-request/backup-request';

// providers
import { LanguageProvider } from '../../providers/language/language';
import { OnGoingProcessProvider } from '../../providers/on-going-process/on-going-process';
import { PopupProvider } from '../../providers/popup/popup';
import { ProfileProvider } from '../../providers/profile/profile';
import { LanguagePage } from '../settings/language/language';

// import { TourPage } from './tour/tour';
@Component({
  selector: 'page-onboarding',
  templateUrl: 'onboarding.html'
})
export class OnboardingPage {
  public currentLanguageName: string;

  /** Number of retries if an error occurred while creating the default wallets.  */
  private retryCount: number = 0;

  constructor(
    public navCtrl: NavController,
    private logger: Logger,
    private translate: TranslateService,
    private profileProvider: ProfileProvider,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private popupProvider: PopupProvider,
    private language: LanguageProvider
  ) {}

  ionViewDidLoad() {
    this.logger.info('Loaded: OnboardingPage');
  }

  ionViewWillEnter() {
    this.currentLanguageName = this.language.getName(
      this.language.getCurrent()
    );
  }

  public createDefaultWallet(): void {
    this.onGoingProcessProvider.set('creatingWallet');
    this.profileProvider
      .createDefaultWallet()
      .then(res => {
        this.onGoingProcessProvider.clear();
        this.navCtrl.push(BackupRequestPage, {
          walletId: res.walletDefault.id,
          fromOnboarding: true,
          password: res.password
        });
        // this.setUpPin(wallets[0]).then(() => {
        // TODO: do something after pin setup
        // no need to collect email
        // this.navCtrl.push(CollectEmailPage, { walletId: wallet.id });

        // this wallets have the same mnemonic which will be backup once
        // this.profileProvider.setBackupFlag(
        //   res.walletsCreated[1].credentials.walletId
        // );
        // this.profileProvider.setBackupFlag(
        //   res.walletsCreated[2].credentials.walletId
        // );
        // this.profileProvider.setBackupFlag(
        //   res.walletsCreated[3].credentials.walletId
        // );
        // });
      })
      .catch(err => {
        setTimeout(() => {
          this.logger.warn(
            'Retrying to create default wallet.....:' + ++this.retryCount
          );
          if (this.retryCount > 3) {
            this.onGoingProcessProvider.clear();
            let title = this.translate.instant('Cannot create wallet');
            let okText = this.translate.instant('Retry');
            this.popupProvider.ionicAlert(title, err, okText).then(() => {
              this.retryCount = 0;
              this.createDefaultWallet();
            });
          } else {
            this.createDefaultWallet();
          }
        }, 2000);
      });
  }

  public restoreFromBackup(): void {
    this.navCtrl.push(ImportWalletPage, { fromOnboarding: true });
  }

  public openLanguagePage(): void {
    this.navCtrl.push(LanguagePage);
  }
}
