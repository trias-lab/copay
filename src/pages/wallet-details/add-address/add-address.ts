import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { NavController, NavParams } from 'ionic-angular';

// providers
import { AddressManagerProvider } from '../../../providers/address-manager/address-manager';
// import { AddressProvider } from '../../../providers/address/address';
import { Logger } from '../../../providers/logger/logger';
import { PopupProvider } from '../../../providers/popup/popup';
import { ProfileProvider } from '../../../providers/profile/profile';
import { WalletProvider } from '../../../providers/wallet/wallet';

@Component({
  selector: 'page-address-add',
  templateUrl: 'add-address.html'
})
export class AddressAddPage {
  private wallet;
  private addressAddForm: FormGroup;
  private addressToEdit: string;

  public isCordova: boolean;
  public edit: boolean;

  constructor(
    private navCtrl: NavController,
    private navParams: NavParams,
    private walletProvider: WalletProvider,
    // private events: Events,
    private am: AddressManagerProvider,
    // private addressProvider: AddressProvider,
    private formBuilder: FormBuilder,
    private logger: Logger,
    private popupProvider: PopupProvider,
    private profileProvider: ProfileProvider, // private address: string
    private translate: TranslateService
  ) {
    this.wallet = this.profileProvider.getWallet(this.navParams.data.walletId);
    this.addressToEdit = this.navParams.get('addressToEdit');
    this.edit = this.navParams.get('edit');
    let oldName = this.navParams.get('oldName');
    this.addressAddForm = this.formBuilder.group({
      name: [
        oldName || this.translate.instant('Default'),
        Validators.compose([Validators.maxLength(20)])
      ],
      address: ''
    });
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: AddressAddPage');
  }

  private async getNewAddr(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.am
        .getAddress(this.wallet, true)
        .then(addr => {
          let address = this.walletProvider.getAddressView(this.wallet, addr);
          this.logger.debug(address);
          return resolve(address);
        })
        .catch(err => {
          return reject(err);
        });
    });
  }

  public confirm(): void {
    this.logger.debug('---this.addressAddForm.value');

    if (this.edit && this.addressToEdit) {
      this.am
        .remove(this.wallet, this.addressToEdit)
        .then(() => {
          this.addressAddForm.controls['address'].setValue(this.addressToEdit);
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
        });
    } else {
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
        });
    }
  }
}
