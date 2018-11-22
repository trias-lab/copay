import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Logger } from '../../providers/logger/logger';

// providers
import { ActionSheetProvider } from '../../providers/action-sheet/action-sheet';
import { AppProvider } from '../../providers/app/app';
import { LanguageProvider } from '../../providers/language/language';
import { PlatformProvider } from '../../providers/platform/platform';
import { ImportWalletPage } from '../add/import-wallet/import-wallet';
import { LanguagePage } from '../settings/language/language';
import { TourPage } from './tour/tour';
@Component({
  selector: 'page-onboarding',
  templateUrl: 'onboarding.html'
})
export class OnboardingPage {
  public isCopay: boolean;
  public appName: string;
  public isElectron: boolean;
  public currentLanguageName: string;

  constructor(
    public navCtrl: NavController,
    private logger: Logger,
    private app: AppProvider,
    private platformProvider: PlatformProvider,
    private actionSheetProvider: ActionSheetProvider,
    private language: LanguageProvider
  ) {
    this.appName = this.app.info.nameCase;
    this.isCopay = this.appName == 'Copay' ? true : false;
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

  public getStarted(): void {
    this.navCtrl.push(TourPage);
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
