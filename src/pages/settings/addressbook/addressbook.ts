import { Component } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { AlertController, NavController, NavParams } from 'ionic-angular';

import * as _ from 'lodash';

import { AddressBookProvider } from '../../../providers/address-book/address-book';
// import { AddressProvider } from '../../../providers/address/address';
import { Logger } from '../../../providers/logger/logger';
import { PopupProvider } from '../../../providers/popup/popup';

import { AddressbookAddPage } from './add/add';

// import { promise } from 'selenium-webdriver';
import { AddressbookViewPage } from './view/view';

@Component({
  selector: 'page-addressbook',
  templateUrl: 'addressbook.html'
})
export class AddressbookPage {
  private cache: boolean = false;

  public addressbook: object[] = [];
  public filteredAddressbook: any[] = [];
  public isEmptyList: boolean;
  public addressArray: object[] = [];
  /** Whether enable to select multiple contacts. */
  public inSelectMode: boolean = false;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public alertCtrl: AlertController,
    private addressBookProvider: AddressBookProvider,
    // private addressProvider: AddressProvider,
    private logger: Logger,
    private translate: TranslateService,
    private popupProvider: PopupProvider,
    private addressbookProvider: AddressBookProvider
  ) {
    this.initAddressbook();
  }

  ionViewDidEnter() {
    if (this.cache) this.initAddressbook();
    this.cache = true;
  }

  private initAddressbook(): void {
    this.addressbookProvider
      .list()
      .then(addressBook => {
        this.isEmptyList = _.isEmpty(addressBook);

        let contacts: object[] = [];
        _.each(addressBook, (contact, k: string) => {
          contacts.push({
            name: _.isObject(contact) ? contact.name : contact,
            address: k,
            email: _.isObject(contact) ? contact.email : null,
            isSelected: false // Default not selected
          });
        });
        this.addressbook = _.clone(contacts);
        this.filteredAddressbook = _.clone(this.addressbook);
      })
      .catch(err => {
        this.logger.error(err);
      });
  }

  /**
   * Go to add contact page.
   */
  public addEntry(): void {
    this.navCtrl.push(AddressbookAddPage);
  }

  /**
   * View details of the contact.
   * If in select mode, only toggle the select box.
   * @param contact
   */
  public viewEntry(contact): void {
    // if in select mode, toggle the select box.
    if (this.inSelectMode) {
      contact.isSelected = !contact.isSelected;
    } else {
      this.navCtrl.push(AddressbookViewPage, { contact });
    }
  }

  /**
   * Search for contacts by the content of searchbar.
   * @param event input event
   */
  public getItems(event): void {
    // get the input content of searchbar
    let val = event.target.value;

    // if the value is an empty string don't filter the items
    if (val && val.trim() != '') {
      let result = _.filter(this.addressbook, item => {
        let name = item['name'];
        return _.includes(name.toLowerCase(), val.toLowerCase());
      });
      this.filteredAddressbook = result;
    } else {
      // Reset items back to all of the items
      this.initAddressbook();
    }
  }

  /**
   * Toggle the select mode.
   */
  public toggleSelectMode(): void {
    this.inSelectMode = !this.inSelectMode;
  }

  /**
   * Handler for the onclick event of delete contacts button.
   */
  public deleteContacts(): void {
    var title = this.translate.instant('Warning!');
    var message = this.translate.instant(
      'Are you sure you want to delete this contact?'
    );

    // whether there is any selected contact
    var hasSelection: boolean = _.some(this.filteredAddressbook, addr => {
      return addr.isSelected;
    });

    if (hasSelection) {
      this.popupProvider
        .ionicConfirm(title, message, null, null)
        .then(res => {
          if (!res) return;
          this.confirmDelete();
        })
        .then(() => {
          this.cancelAllSelect();
        })
        .catch(err => {
          this.popupProvider.ionicAlert(this.translate.instant('Error'), err);
          return;
        });
    } else {
      this.popupProvider.ionicConfirm(
        title,
        'Please select the contact you want to delete',
        null,
        null
      );
    }
  }

  /**
   * Delete contacts from the address book and update the view.
   * @param contacts
   */
  private async confirmDelete(): Promise<any> {
    // Filter selected ones from contacts.
    let contactsSelected = _.filter(this.filteredAddressbook, o => {
      return o.isSelected;
    });
    for (let i = 0; i < contactsSelected.length; i++) {
      await this.addressBookProvider
        .remove(contactsSelected[i].address)
        .then(() => {
          this.initAddressbook();
        });
    }
  }

  /**
   * Unselect all contacts.
   * @param contacts contact collection
   */
  public cancelAllSelect(): void {
    for (let i = 0; i < this.filteredAddressbook.length; i++) {
      this.filteredAddressbook[i].isSelected = false;
    }

    this.toggleSelectMode();
  }
}
