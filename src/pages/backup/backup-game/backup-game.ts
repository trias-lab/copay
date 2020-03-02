import { Component, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  Events,
  Navbar,
  NavController,
  NavParams,
  Slides
} from 'ionic-angular';
import * as _ from 'lodash';
import { Logger } from '../../../providers/logger/logger';

// pages
import { DisclaimerPage } from '../../onboarding/disclaimer/disclaimer';

// providers
import { ActionSheetProvider } from '../../../providers/action-sheet/action-sheet';
import { BwcErrorProvider } from '../../../providers/bwc-error/bwc-error';
import { BwcProvider } from '../../../providers/bwc/bwc';
import { OnGoingProcessProvider } from '../../../providers/on-going-process/on-going-process';
import { PersistenceProvider } from '../../../providers/persistence/persistence';
import { ProfileProvider } from '../../../providers/profile/profile';
import { WalletProvider } from '../../../providers/wallet/wallet';

@Component({
  selector: 'page-backup-game',
  templateUrl: 'backup-game.html'
})
export class BackupGamePage {
  @ViewChild(Slides)
  slides: Slides;
  @ViewChild(Navbar)
  navBar: Navbar;

  /** If it is from onboarding page. */
  private fromOnboarding: boolean;
  private password: string;
  private walletId: string;

  public currentIndex: number;
  public deleted: boolean;
  public mnemonicWords: string[];
  public shuffledMnemonicWords;
  public customWords;
  public selectComplete: boolean;
  public error: boolean;
  public credentialsEncrypted: boolean;
  public mnemonicHasPassphrase;
  public useIdeograms;
  public wallet;
  public keys;
  /** whether word is selected in wrong order when check mnemonic */
  public isWrongOrder: boolean;

  constructor(
    private events: Events,
    private navCtrl: NavController,
    private navParams: NavParams,
    private logger: Logger,
    private profileProvider: ProfileProvider,
    private walletProvider: WalletProvider,
    private bwcProvider: BwcProvider,
    private bwcErrorProvider: BwcErrorProvider,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private persistenceProvider: PersistenceProvider,
    private translate: TranslateService,
    public actionSheetProvider: ActionSheetProvider
  ) {
    this.walletId = this.navParams.get('walletId');
    this.fromOnboarding = this.navParams.get('fromOnboarding');
    this.password = this.navParams.get('password');
    this.wallet = this.profileProvider.getWallet(this.walletId);
    this.credentialsEncrypted = this.wallet.isPrivKeyEncrypted();
  }

  ionViewDidEnter() {
    this.deleted = this.isDeletedSeed();
    if (this.deleted) {
      this.logger.warn('no mnemonics');
      return;
    }

    if (this.fromOnboarding) {
      this.credentialsEncrypted = false;
      this.keys = this.wallet.getKeys(this.password);
      this.setFlow();
    } else {
      this.walletProvider
        .getKeys(this.wallet)
        .then(keys => {
          if (_.isEmpty(keys)) {
            this.logger.warn('Empty keys');
          }
          this.credentialsEncrypted = false;
          this.keys = keys;
          this.setFlow();
        })
        .catch(err => {
          if (
            err &&
            err.message != 'FINGERPRINT_CANCELLED' &&
            err.message != 'PASSWORD_CANCELLED'
          ) {
            const title = this.translate.instant('Could not decrypt wallet');
            this.showErrorInfoSheet(this.bwcErrorProvider.msg(err), title);
          }
          this.navCtrl.pop();
        });
    }
  }

  ngOnInit() {
    this.currentIndex = 0;
    if (!this.fromOnboarding) {
      this.navBar.backButtonClick = () => {
        if (this.slides) this.slidePrev();
        else this.navCtrl.pop();
      };
    }
  }

  ionViewDidLoad() {
    if (this.slides) this.slides.lockSwipes(true);
  }

  private showErrorInfoSheet(
    err: Error | string,
    infoSheetTitle: string
  ): void {
    if (!err) return;
    this.logger.warn('Could not get keys:', err);
    const errorInfoSheet = this.actionSheetProvider.createInfoSheet(
      'default-error',
      { msg: err, title: infoSheetTitle }
    );
    errorInfoSheet.present();
  }

  /**
   * Generate shuffled mnemonic words
   * @param words mnemonic words
   * @returns shuffled mnemonic words
   */
  private shuffledWords(words: string[]) {
    const sort = _.sortBy(words);

    return _.map(sort, w => {
      return {
        word: w,
        selected: false
      };
    });
  }

  /**
   * Add a button to the input area when a word is selected.
   * @param index index of word in [shuffled mnemonic words]{@link shuffledMnemonicWords}.
   * @param item selected word
   */
  public addButton(index: number, item): void {
    const newWord = {
      word: item.word,
      prevIndex: index,
      correct: true
    };
    this.customWords.push(newWord);
    this.checkOrder();
    this.shuffledMnemonicWords[index].selected = true;
    this.shouldContinue();
  }

  /**
   * Remove a button from the input area when a word is selected.
   * @param index index of selected word in the input area
   * @param item selected word
   */
  public removeButton(index: number, item): void {
    // if ($scope.loading) return;
    this.customWords.splice(index, 1);
    this.checkOrder();
    this.shuffledMnemonicWords[item.prevIndex].selected = false;
    this.shouldContinue();
  }

  private shouldContinue(): void {
    this.selectComplete =
      this.customWords.length === this.shuffledMnemonicWords.length;
  }

  private isDeletedSeed(): boolean {
    if (
      !this.wallet.credentials.mnemonic &&
      !this.wallet.credentials.mnemonicEncrypted
    )
      return true;

    return false;
  }

  private slidePrev(): void {
    this.slides.lockSwipes(false);
    if (this.currentIndex == 0) this.navCtrl.pop();
    else {
      this.slides.slidePrev();
      this.currentIndex = this.slides.getActiveIndex();
    }
    this.slides.lockSwipes(true);
  }

  public slideNext(reset: boolean): void {
    if (reset) {
      this.resetGame();
    }

    if (this.currentIndex == 1 && !this.mnemonicHasPassphrase) this.finalStep();
    else {
      this.slides.lockSwipes(false);
      this.slides.slideNext();
    }

    this.currentIndex = this.slides.getActiveIndex();
    this.slides.lockSwipes(true);
  }

  private resetGame() {
    this.customWords = [];
    this.shuffledMnemonicWords.forEach(word => {
      word.selected = false;
    });
    this.selectComplete = false;
  }

  /**
   * Set game flow. Get mnemonic words and generate shuffled words.
   */
  private setFlow(): void {
    if (!this.keys) return;

    let words = this.keys.mnemonic;

    this.mnemonicWords = words.split(/[\u3000\s]+/);
    this.shuffledMnemonicWords = this.shuffledWords(this.mnemonicWords);
    this.mnemonicHasPassphrase = this.wallet.mnemonicHasPassphrase();
    this.useIdeograms = words.indexOf('\u3000') >= 0;
    // this.password = '';
    this.customWords = [];
    this.selectComplete = false;
    this.isWrongOrder = false;
    this.error = false;

    // words = _.repeat('x', 300);

    if (this.currentIndex == 2) this.slidePrev();
  }

  /**
   * Check if the selected mnemonic words are in correct order
   */
  public checkOrder(): void {
    this.isWrongOrder = false;
    let wordsCount = this.customWords.length;
    if (wordsCount > 0) {
      for (var i = 0; i < wordsCount; i++) {
        if (this.customWords[i].word !== this.mnemonicWords[i]) {
          this.isWrongOrder = true;
          this.customWords[i].correct = false;
        } else {
          this.customWords[i].correct = true;
        }
      }
    }
  }

  /**
   * Verify if the words are in the correct order.
   */
  private confirm(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.error = false;

      const customWordList = _.map(this.customWords, 'word');

      if (!_.isEqual(this.mnemonicWords, customWordList)) {
        return reject('Mnemonic string mismatch');
      }

      if (this.mnemonicHasPassphrase) {
        const walletClient = this.bwcProvider.getClient();
        const separator = this.useIdeograms ? '\u3000' : ' ';
        const customSentence = customWordList.join(separator);
        const password = this.password || '';

        try {
          walletClient.seedFromMnemonic(customSentence, {
            network: this.wallet.credentials.network,
            passphrase: password,
            account: this.wallet.credentials.account
          });
        } catch (err) {
          walletClient.credentials.xPrivKey = _.repeat('x', 64);
          return reject(err);
        }

        if (
          walletClient.credentials.xPrivKey.substr(
            walletClient.credentials.xPrivKey
          ) != this.keys.xPrivKey
        ) {
          delete walletClient.credentials;
          return reject('Private key mismatch');
        }
      }

      this.profileProvider.setBackupFlag(this.wallet.credentials.walletId);
      // if from onboarding page, set other wallets needsBackup flag to false
      if (this.fromOnboarding) {
        let wallets = this.profileProvider.getWallets();
        _.each(wallets, value => {
          this.profileProvider.setBackupFlag(value.credentials.walletId);
        });
      }
      return resolve();
    });
  }

  private finalStep(): void {
    this.onGoingProcessProvider.set('validatingWords');
    this.confirm()
      .then(() => {
        this.onGoingProcessProvider.clear();
        const walletType =
          this.wallet.coin === 'btc' ? 'bitcoin' : 'bitcoin cash';
        const infoSheet = this.actionSheetProvider.createInfoSheet(
          'backup-ready',
          { walletType }
        );
        infoSheet.present();
        infoSheet.onDidDismiss(() => {
          if (this.fromOnboarding) {
            this.persistenceProvider.setOnboardingCompleted();
            this.navCtrl.push(DisclaimerPage);
          } else {
            this.navCtrl.popToRoot();
            this.events.publish('Wallet/setAddress', true);
          }
        });
      })
      .catch(err => {
        this.onGoingProcessProvider.clear();
        this.logger.warn('Failed to verify backup: ', err);
        this.error = true;
        const infoSheet = this.actionSheetProvider.createInfoSheet(
          'backup-failed'
        );
        infoSheet.present();
        infoSheet.onDidDismiss(() => {
          this.setFlow();
        });
      });
  }
}
