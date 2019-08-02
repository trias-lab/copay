import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NavController } from 'ionic-angular';
import { Logger } from '../../providers/logger/logger';

// pages
import { ImportWalletPage } from '../add/import-wallet/import-wallet';
import { BackupRequestPage } from '../backup/backup-request/backup-request';
// import { CollectEmailPage } from './collect-email/collect-email';

// providers
import { ActionSheetProvider } from '../../providers/action-sheet/action-sheet';
import { AppProvider } from '../../providers/app/app';
import { LanguageProvider } from '../../providers/language/language';
import { OnGoingProcessProvider } from '../../providers/on-going-process/on-going-process';
// import { PersistenceProvider } from '../../providers/persistence/persistence';
import { PlatformProvider } from '../../providers/platform/platform';
import { PopupProvider } from '../../providers/popup/popup';
import { ProfileProvider } from '../../providers/profile/profile';
import { LanguagePage } from '../settings/language/language';

// import { TourPage } from './tour/tour';
@Component({
  selector: 'page-onboarding',
  templateUrl: 'onboarding.html'
})
export class OnboardingPage {
  public isCopay: boolean;
  public appName: string;
  public isElectron: boolean;
  public currentLanguageName: string;

  private retryCount: number = 0;

  constructor(
    public navCtrl: NavController,
    private logger: Logger,
    private translate: TranslateService,
    private app: AppProvider,
    private platformProvider: PlatformProvider,
    private actionSheetProvider: ActionSheetProvider,
    private profileProvider: ProfileProvider,
    private onGoingProcessProvider: OnGoingProcessProvider,
    // private persistenceProvider: PersistenceProvider,
    private popupProvider: PopupProvider,
    private language: LanguageProvider
  ) {
    this.appName = this.app.info.nameCase;
    this.isCopay = this.appName == 'Copay';
    this.isElectron = this.platformProvider.isElectron;
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: OnboardingPage');
  }

  ionViewWillEnter() {
    this.currentLanguageName = this.language.getName(
      this.language.getCurrent()
    );
  }
  ionViewDidEnter() {
    if (this.isElectron) this.openElectronInfoModal();
  }

  public createDefaultWallet(): void {
    this.onGoingProcessProvider.set('creatingWallet');
    this.profileProvider
      .createDefaultWallet()
      .then(res => {
        this.onGoingProcessProvider.clear();
        this.navCtrl.push(BackupRequestPage, {
          walletId: res.walletsCreated[0].id,
          fromOnboarding: true,
          password: res.password
        });
        // this.setUpPin(wallets[0]).then(() => {
        // TODO: do something after pin setup
        // no need to collect email
        // this.navCtrl.push(CollectEmailPage, { walletId: wallet.id });

        // this wallets have the same mnemonic which will be backup once
        this.profileProvider.setBackupFlag(
          res.walletsCreated[1].credentials.walletId
        );
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

  public openElectronInfoModal(): void {
    const infoSheet = this.actionSheetProvider.createInfoSheet(
      'electron-info',
      {
        appName: this.appName
      }
    );
    infoSheet.present();
  }

  public openLanguagePage(): void {
    this.navCtrl.push(LanguagePage);
  }
}
