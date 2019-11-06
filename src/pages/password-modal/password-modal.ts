import { Component, ViewChild } from '@angular/core';
import { StatusBar } from '@ionic-native/status-bar';
import { Vibration } from '@ionic-native/vibration';
import { NavController, NavParams, Platform } from 'ionic-angular';
import { Subscription } from 'rxjs';

import { Animate } from '../../directives/animate/animate';

// Providers
import { PopupProvider } from '../../providers/popup/popup';
import { ProfileProvider } from '../../providers/profile/profile';
import { TouchIdProvider } from '../../providers/touchid/touchid';

/**
 * Generated class for the PasswordModalPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-password-modal',
  templateUrl: 'password-modal.html'
})
export class PasswordModalPage {
  private onPauseSubscription: Subscription;

  public currentPassword: string;
  public action: string;
  public unregister;

  @ViewChild(Animate)
  passwordInput: Animate;

  constructor(
    private platform: Platform,
    private navCtrl: NavController,
    private navParams: NavParams,
    private touchid: TouchIdProvider,
    private profileProvider: ProfileProvider,
    private vibration: Vibration,
    private popupProvider: PopupProvider,
    private statusBar: StatusBar
  ) {
    this.unregister = this.platform.registerBackButtonAction(() => {});

    // action could be:
    // - checkPassword: use to check the pin code before entering the APP. The Modal DO NOT have a cancel button.
    // - checkFingerprint: use to check the touchID or faceID before entering the APP. If the check is cancelled or failed, PIN can be used to unlock the app.
    this.action = this.navParams.get('action');

    if (this.action === 'checkFingerprint') {
      this.unregister = this.platform.registerBackButtonAction(() => {});
      this.checkFingerprint();
    }
  }

  ionViewWillEnter() {
    // set status bar style
    if (this.platform.is('ios')) {
      this.statusBar.styleDefault();
    }
  }

  ionViewWillLeave() {
    // reset status bar style
    if (this.platform.is('ios')) {
      this.statusBar.styleLightContent();
    }
  }

  ionViewDidLoad() {
    this.onPauseSubscription = this.platform.pause.subscribe(() => {
      this.currentPassword = '';
    });
  }

  ngOnDestroy() {
    this.onPauseSubscription.unsubscribe();
  }

  public checkFingerprint(): void {
    this.touchid.check().then(() => {
      this.unregister();
      this.navCtrl.pop({ animate: true });
    });
  }

  public close(): void {
    this.unregister();
    this.navCtrl.pop({ animate: true }); // navigate to the previous page in the stack.
  }

  public confirm(): void {
    let wallets = this.profileProvider.getWallets();
    if (wallets && wallets[0]) {
      let wallet = wallets[0];
      if (this.currentPassword && wallet.checkPassword(this.currentPassword)) {
        this.close();
      } else {
        this.currentPassword = '';
        this.shakeInput();
      }
    } else {
      this.popupProvider.ionicAlert('Please try again later.');
    }
  }

  public shakeInput() {
    this.passwordInput.animate('shake');
    this.vibration.vibrate(100);
  }
}
