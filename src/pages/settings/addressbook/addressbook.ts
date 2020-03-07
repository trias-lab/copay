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
  public filteredAddressbook: object[] = [];

  public isEmptyList: boolean;
  public addressArray: object[] = [];

  // select edit address book list
  public showEditAllRadio: boolean = false;

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
            showEditRadio: false // Default not selected
          });
        });
        this.addressbook = _.clone(contacts);
        this.filteredAddressbook = _.clone(this.addressbook);
      })
      .catch(err => {
        this.logger.error(err);
      });
  }

  public addEntry(): void {
    this.navCtrl.push(AddressbookAddPage);
  }

  public viewEntry(contact): void {
    // if select editEntry option , this.showEditAllRadio = true
    if (this.showEditAllRadio) {
      // edit address book list
      this.selectDeletAdd(contact);
    } else {
      this.navCtrl.push(AddressbookViewPage, { contact });
    }
  }

  public getItems(event): void {
    // set val to the value of the searchbar
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

  // select edit address book list
  public editeEntry(): void {
    this.showEditAllRadio = true;
  }
  // edit address book list
  public selectDeletAdd(contactList): void {
    contactList.showEditRadio = !contactList.showEditRadio;
  }
  public filterDeleteAdd(contact): any {
    let deleteListAdd: object[] = [];
    for (let i = 0; i < contact.length; i++) {
      if (contact[i].showEditRadio) {
        deleteListAdd.push(contact[i]);
      }
    }
    return deleteListAdd;
  }
  public deleteAddConfirm(contact): void {
    var title = this.translate.instant('Warning!');
    var message = this.translate.instant(
      'Are you sure you want to delete this contact?'
    );

    var isSelect: boolean = false;

    _.each(contact, data => {
      if (data.showEditRadio) {
        isSelect = true;
      }
    });

    if (isSelect) {
      this.popupProvider
        .ionicConfirm(title, message, null, null)
        .then(res => {
          if (!res) return;
          this.removeAddList(contact);
        })
        .then(() => {
          this.deleteCancel(contact);
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

  public async removeAddList(contact): Promise<any> {
    let deleteListAdd = this.filterDeleteAdd(contact);
    for (let i = 0; i < deleteListAdd.length; i++) {
      await this.addressBookProvider
        .remove(deleteListAdd[i].address)
        .then(() => {
          this.initAddressbook();
        });
    }
  }

  public deleteCancel(contact): any {
    for (let i = 0; i < contact.length; i++) {
      contact[i].showEditRadio = false;
    }

    this.showEditAllRadio = false;
  }
}
