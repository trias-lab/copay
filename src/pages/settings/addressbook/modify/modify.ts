import { Component } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators
} from '@angular/forms';
import {
  Events,
  // NavController,
  NavParams,
  ViewController
} from 'ionic-angular';

// providers
import { AddressBookProvider } from '../../../../providers/address-book/address-book';
import { AddressProvider } from '../../../../providers/address/address';
import { Logger } from '../../../../providers/logger/logger';
import { PopupProvider } from '../../../../providers/popup/popup';

// validators
import { AddressValidator } from '../../../../validators/address';

@Component({
  selector: 'page-addressbook-add',
  templateUrl: 'modify.html'
})
export class AddressbookModifyPage {
  private addressBookAdd: FormGroup;

  public isCordova: boolean;

  constructor(
    // private navCtrl: NavController,
    private navParams: NavParams,
    private events: Events,
    private ab: AddressBookProvider,
    private addressProvider: AddressProvider,
    private formBuilder: FormBuilder,
    private logger: Logger,
    private viewCtrl: ViewController,
    private popupProvider: PopupProvider
  ) {
    this.addressBookAdd = this.formBuilder.group({
      name: [
        this.navParams.data.name,
        Validators.compose([Validators.minLength(1), Validators.required])
      ],
      email: [this.navParams.data.email, this.emailOrEmpty],
      address: [
        this.navParams.data.address,
        Validators.compose([
          Validators.required,
          new AddressValidator(this.addressProvider).isValid
        ])
      ]
    });
    if (this.navParams.data.addressbookEntry) {
      this.addressBookAdd.controls['address'].setValue(
        this.navParams.data.addressbookEntry
      );
    }
    this.events.subscribe('update:address', data => {
      this.addressBookAdd.controls['address'].setValue(
        this.parseAddress(data.value)
      );
    });
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: AddressbookAddPage');
  }

  ngOnDestroy() {
    this.events.unsubscribe('update:address');
  }

  /**
   * Validation of email in the form.
   * @param control
   */
  private emailOrEmpty(control: AbstractControl): ValidationErrors | null {
    return control.value === '' ? null : Validators.email(control);
  }

  public save(): void {
    this.addressBookAdd.controls['address'].setValue(
      this.parseAddress(this.addressBookAdd.value.address)
    );
    this.ab
      .modify(this.addressBookAdd.value)
      .then(() => {
        let concact = this.addressBookAdd.value;

        this.viewCtrl.dismiss(concact);
      })
      .catch(err => {
        this.popupProvider.ionicAlert('Error', err);
      });
  }

  public cancel(): void {
    let concact = this.navParams.data;

    this.viewCtrl.dismiss(concact);
  }

  /**
   * Remove prefix of the address.
   * @param address
   */
  private parseAddress(address: string): string {
    return address.replace(
      /^(bitcoincash:|bchtest:|bitcoin:|bitcoreEth:|bitcoreTry:)/i,
      ''
    );
  }
}
