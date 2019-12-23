import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

// providers
import { LanguageProvider } from '../../../providers/language/language';
import { ProfileProvider } from '../../../providers/profile/profile';
import { WalletProvider } from '../../../providers/wallet/wallet';

@Component({
  selector: 'page-language',
  templateUrl: 'language.html'
})
export class LanguagePage {
  public currentLanguage;
  public languages;

  constructor(
    private navCtrl: NavController,
    private languageProvider: LanguageProvider,
    private profileProvider: ProfileProvider,
    private walletProvider: WalletProvider
  ) {
    this.currentLanguage = this.languageProvider.getCurrent();
    this.languages = this.languageProvider.getAvailables();
  }

  public save(newLang: string): void {
    this.languageProvider.set(newLang);
    this.navCtrl.pop();
    setTimeout(() => {
      let wallets = this.profileProvider.getWallets();
      this.walletProvider.updateRemotePreferences(wallets);
    }, 1000);
  }
}
