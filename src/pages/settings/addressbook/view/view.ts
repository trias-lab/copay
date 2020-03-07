import { Component } from '@angular/core';
import { StatusBar } from '@ionic-native/status-bar';
import { TranslateService } from '@ngx-translate/core';
import {
  ModalController,
  NavController,
  NavParams,
  Platform
} from 'ionic-angular';

// Pages

// import { from } from 'rxjs/observable/from';
import { AmountPage } from '../../../../pages/send/amount/amount';
// Providers
import { AddressBookProvider } from '../../../../providers/address-book/address-book';
import { AddressProvider } from '../../../../providers/address/address';
import { PopupProvider } from '../../../../providers/popup/popup';
import { AddressbookModifyPage } from '../modify/modify';

@Component({
  selector: 'page-addressbook-view',
  templateUrl: 'view.html'
})
export class AddressbookViewPage {
  public contact;
  public address: string;
  public name: string;
  public email: string;

  constructor(
    private addressBookProvider: AddressBookProvider,
    private addressProvider: AddressProvider,
    private navCtrl: NavController,
    private navParams: NavParams,
    private modalCtrl: ModalController,
    private popupProvider: PopupProvider,
    private translate: TranslateService,
    private platform: Platform,
    private statusBar: StatusBar
  ) {}

  ionViewWillEnter() {
    // set status bar style
    if (this.platform.is('ios')) {
      this.statusBar.styleLightContent();
    }

    this.address = this.navParams.data.contact.address;
    this.name = this.navParams.data.contact.name;
    this.email = this.navParams.data.contact.email;
  }

  ionViewWillLeave() {
    // reset status bar style
    if (this.platform.is('ios')) {
      this.statusBar.styleDefault();
    }
  }

  /**
   * Send funds to the contact.
   */
  public sendTo(): void {
    this.navCtrl.push(AmountPage, {
      toAddress: this.address,
      name: this.name,
      email: this.email,
      coin: this.addressProvider.getCoin(this.address),
      recipientType: 'contact',
      network: this.addressProvider.getNetwork(this.address)
    });
  }

  /**
   * Modify the name, email or address of the contact.
   */
  public modify(): void {
    let newsModal = this.modalCtrl.create(AddressbookModifyPage, {
      address: this.address,
      name: this.name,
      email: this.email
    });
    newsModal.onDidDismiss(data => {
      this.address = data.address;
      this.name = data.name;
      this.email = data.email;
    });
    newsModal.present();
  }

  /**
   * Remove this contact.
   * @param addr
   */
  public remove(addr: string): void {
    var title = this.translate.instant('Warning!');
    var message = this.translate.instant(
      'Are you sure you want to delete this contact?'
    );
    this.popupProvider.ionicConfirm(title, message, null, null).then(res => {
      if (!res) return;
      this.addressBookProvider
        .remove(addr)
        .then(() => {
          this.navCtrl.pop();
        })
        .catch(err => {
          this.popupProvider.ionicAlert(this.translate.instant('Error'), err);
          return;
        });
    });
  }
}
