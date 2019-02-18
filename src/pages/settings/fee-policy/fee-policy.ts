import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import * as _ from 'lodash';
import { Logger } from '../../../providers/logger/logger';

// Providers
import { ConfigProvider } from '../../../providers/config/config';
import { FeeProvider } from '../../../providers/fee/fee';

// Pages
import { HomePage } from '../../home/home';
import { SettingsPage } from '../settings';

const COIN = 'btc';
const NETWORK = 'livenet';

@Component({
  selector: 'page-fee-policy',
  templateUrl: 'fee-policy.html'
})
export class FeePolicyPage {
  public feeLevels: object;
  public feeOpts: object;
  public currentFeeLevel: string;

  public error;

  public feePerSatByte;
  public avgConfirmationTime;

  constructor(
    private logger: Logger,
    private navCtrl: NavController,
    private feeProvider: FeeProvider,
    private configProvider: ConfigProvider
  ) {
    this.feeOpts = this.feeProvider.getFeeOpts();
    delete this.feeOpts['custom']; // Remove custom level
    this.currentFeeLevel = this.feeProvider.getCurrentFeeLevel();
  }

  // when init the page
  ngAfterViewInit() {
    let elements = document.querySelectorAll('.tabbar');
    if (elements != null) {
      Object.keys(elements).map(key => {
        elements[key].style.display = 'none';
      });
    }
  }

  // when quit the page
  ionViewWillLeave() {
    let elements = document.querySelectorAll('.tabbar');
    if (elements != null) {
      Object.keys(elements).map(key => {
        elements[key].style.display = 'flex';
      });
    }
  }

  ionViewDidEnter() {
    this.error = null;
    return this.feeProvider
      .getFeeLevels(COIN)
      .then(data => {
        this.feeLevels = data['levels'];
        this.updateCurrentValues();
      })
      .catch(err => {
        this.logger.error(err);
        this.error = err;
      });
  }

  public save() {
    if (
      _.isEmpty(this.currentFeeLevel) ||
      this.currentFeeLevel == this.feeProvider.getCurrentFeeLevel()
    )
      return;
    this.logger.debug('New fee level: ' + this.currentFeeLevel);
    this.updateCurrentValues();
    this.setFee();
  }

  private updateCurrentValues() {
    if (_.isEmpty(this.feeLevels) || _.isEmpty(this.currentFeeLevel)) return;

    let value = _.find(this.feeLevels[NETWORK], {
      level: this.currentFeeLevel
    });

    if (_.isEmpty(value)) return;

    this.feePerSatByte = (value['feePerKb'] / 1000).toFixed();
    this.avgConfirmationTime = value['nbBlocks'] * 10;
  }

  private setFee() {
    let opts = {
      wallet: {
        settings: {
          feeLevel: this.currentFeeLevel
        }
      }
    };

    this.configProvider.set(opts);
  }

  public goToHomePage(): void {
    this.navCtrl.push(HomePage);
  }

  public goToSettingsPage(): void {
    this.navCtrl.push(SettingsPage);
  }
}
