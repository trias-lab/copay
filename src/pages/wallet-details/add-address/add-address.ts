import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { NavController, NavParams } from 'ionic-angular';

// providers
import { AddressManagerProvider } from '../../../providers/address-manager/address-manager';
// import { AddressProvider } from '../../../providers/address/address';
import { Logger } from '../../../providers/logger/logger';
import { PopupProvider } from '../../../providers/popup/popup';
import { ProfileProvider } from '../../../providers/profile/profile';

@Component({
  selector: 'page-address-add',
  templateUrl: 'add-address.html'
})
export class AddressAddPage {
  private wallet;
  private addressAddForm: FormGroup;

  public isCordova: boolean;

  constructor(
    private navCtrl: NavController,
    private navParams: NavParams,
    // private events: Events,
    private am: AddressManagerProvider,
    // private addressProvider: AddressProvider,
    private formBuilder: FormBuilder,
    private logger: Logger,
    private popupProvider: PopupProvider,
    private profileProvider: ProfileProvider,
    // private address: string
  ) {
    this.addressAddForm = this.formBuilder.group({
      name: [
        '',
        Validators.compose([Validators.minLength(1), Validators.required])
      ],
      address: ['']
    });
    this.wallet = this.profileProvider.getWallet(this.navParams.data.walletId);
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: AddressAddPage');
    
  }

  private getNewAddr(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.am.getAddress(this.wallet, true)
        .then(addr => {
          this.logger.debug(addr)
          return resolve(addr)
        })
        .catch(err => {
          return reject(err);
        })
      })    
  }

  public confirm(): void {
    this.logger.debug('---this.addressAddForm.value')
    
    this.getNewAddr()
      .then(addr => {
        this.addressAddForm.controls['address'].setValue(addr);
        this.am
          .add(this.wallet, this.addressAddForm.value)
          .then(() => {
            this.navCtrl.pop();
          })
          .catch(err => {
            this.popupProvider.ionicAlert('Error', err);
          });
      })
      .catch(err => {          
        this.popupProvider.ionicAlert('Error', err);
      })    
  }
}
