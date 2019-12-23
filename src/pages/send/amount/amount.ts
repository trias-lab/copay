import {
  ChangeDetectorRef,
  Component,
  HostListener,
  NgZone
} from '@angular/core';
import { Events, NavController, NavParams } from 'ionic-angular';
import * as _ from 'lodash';

// Providers
import { Config, ConfigProvider } from '../../../providers/config/config';
import { ElectronProvider } from '../../../providers/electron/electron';
import { FilterProvider } from '../../../providers/filter/filter';
import { Logger } from '../../../providers/logger/logger';
import { PlatformProvider } from '../../../providers/platform/platform';
import { RateProvider } from '../../../providers/rate/rate';
import { TxFormatProvider } from '../../../providers/tx-format/tx-format';

// Pages
import { ProfileProvider } from '../../../providers/profile/profile';
import { Coin } from '../../../providers/wallet/wallet';
import { CustomAmountPage } from '../../receive/custom-amount/custom-amount';
import { WalletTabsChild } from '../../wallet-tabs/wallet-tabs-child';
import { WalletTabsProvider } from '../../wallet-tabs/wallet-tabs.provider';
import { ConfirmPage } from '../confirm/confirm';

@Component({
  selector: 'page-amount',
  templateUrl: 'amount.html'
})
export class AmountPage extends WalletTabsChild {
  private LENGTH_EXPRESSION_LIMIT: number;
  private availableUnits;
  public unit: string;
  private reNr: RegExp;
  private reOp: RegExp;
  private nextView;
  private fixedUnit: boolean;
  public fiatCode: string;
  private altUnitIndex: number;
  private unitIndex: number;
  private unitToSatoshi: number;
  private unitToWei: number;
  private unitToCoin: number;
  private satToUnit: number;
  private weiToUnit: number;
  private coinToUnit: number;
  private unitDecimals: number;
  private zone;
  private description: string;

  public disableHardwareKeyboard: boolean;
  public onlyIntegers: boolean;
  public alternativeUnit: string;
  public globalResult: string;
  public alternativeAmount;
  public expression;
  public amount;

  public showSendMax: boolean;
  public allowSend: boolean;
  public recipientType: string;
  public coin: string;
  public toAddress: string;
  public network: string;
  public name: string;
  public email: string;
  public color: string;
  public useSendMax: boolean;
  public config: Config;
  private _id: string;
  public requestingAmount: boolean;

  constructor(
    private configProvider: ConfigProvider,
    private filterProvider: FilterProvider,
    private logger: Logger,
    navCtrl: NavController,
    private navParams: NavParams,
    private electronProvider: ElectronProvider,
    private platformProvider: PlatformProvider,
    profileProvider: ProfileProvider,
    private rateProvider: RateProvider,
    private txFormatProvider: TxFormatProvider,
    private changeDetectorRef: ChangeDetectorRef,
    walletTabsProvider: WalletTabsProvider,
    private events: Events
  ) {
    super(navCtrl, profileProvider, walletTabsProvider);
    this.zone = new NgZone({ enableLongStackTrace: false });
    this.config = this.configProvider.get();
    this.recipientType = this.navParams.data.recipientType;
    this.toAddress = this.navParams.data.toAddress;
    this.network = this.navParams.data.network;
    this.name = this.navParams.data.name;
    this.email = this.navParams.data.email;
    this.color = this.navParams.data.color;
    this.coin = this.navParams.data.coin;
    this.fixedUnit = this.navParams.data.fixedUnit;
    this.description = this.navParams.data.description;
    this.onlyIntegers = this.navParams.data.onlyIntegers
      ? this.navParams.data.onlyIntegers
      : false;

    this.showSendMax = false;
    this.useSendMax = false;
    this.allowSend = false;

    this.availableUnits = [];
    this.expression = '';

    this.LENGTH_EXPRESSION_LIMIT = 19;
    this.amount = 0;
    this.altUnitIndex = 0;
    this.unitIndex = 0;

    this.reNr = /^[1234567890\.]$/;
    this.reOp = /^[\*\+\-\/]$/;

    this.requestingAmount =
      this.navParams.get('nextPage') === 'CustomAmountPage';
    this.nextView = this.getNextView();

    this.unitToSatoshi = this.config.wallet.settings.unitToSatoshi;
    this.unitToWei = this.config.wallet.settings.unitToWei;
    this.satToUnit = 1 / this.unitToSatoshi;
    this.weiToUnit = 1 / this.unitToWei;
    this.unitDecimals = this.config.wallet.settings.unitDecimals;

    // BitPay Card ID or Wallet ID
    this._id = this.navParams.data.id;
  }

  async ionViewDidLoad() {
    this.setAvailableUnits();
    this.updateUnitUI();
  }

  ionViewWillEnter() {
    this.disableHardwareKeyboard = false;
    this.expression = '';
    this.useSendMax = false;
    this.processAmount();
    this.events.subscribe('Wallet/disableHardwareKeyboard', () => {
      this._disableHardwareKeyboard();
    });
  }

  ionViewWillLeave() {
    this._disableHardwareKeyboard();
  }

  private _disableHardwareKeyboard() {
    this.disableHardwareKeyboard = true;
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (this.disableHardwareKeyboard) return;
    if (!event.key) return;
    // delete
    if (event.which === 8) {
      event.preventDefault();
      this.removeDigit();
    }
    if (event.key.match(this.reNr)) {
      this.pushDigit(event.key, true);
    } else if (event.key.match(this.reOp)) {
      this.pushOperator(event.key);
    }
    // check if you press the v key
    else if (event.keyCode === 86) {
      // check if you press the Ctrl key or meta key
      if (event.ctrlKey || event.metaKey) this.processClipboard();
    }
    // check if you press enter key
    else if (event.keyCode === 13) this.finish();
  }

  private setAvailableUnits(): void {
    this.availableUnits = [];

    const parentWalletCoin = this.coin;

    if (parentWalletCoin == 'eth') {
      this.unitToCoin = this.unitToWei;
    } else if (parentWalletCoin == 'try') {
      this.unitToCoin = this.unitToWei;
    } else {
      this.unitToCoin = this.unitToSatoshi;
    }
    // this.logger.info(
    //   this.wallet.coin +
    //     '--------------------------------------- this.wallet.coin!!!!!!!!!!!!!!!!!!!!!!!!!'
    // );
    // this.logger.info(
    //   this.unitToCoin +
    //     '--------------------------------------- this.unitToCoin!!!!!!!!!!!!!!!!!!!!!!!!!'
    // );
    if (parentWalletCoin == 'eth') {
      this.coinToUnit = this.weiToUnit;
    } else if (parentWalletCoin == 'try') {
      this.coinToUnit = this.weiToUnit;
    } else {
      this.coinToUnit = this.satToUnit;
    }
    // this.unitToCoin =
    //   parentWalletCoin !== 'eth' ? this.unitToSatoshi : this.unitToWei;
    // this.coinToUnit =
    //   parentWalletCoin !== 'eth' ? this.satToUnit : this.weiToUnit;

    if (parentWalletCoin === 'btc' || !parentWalletCoin) {
      this.availableUnits.push({
        name: 'Bitcoin',
        id: 'btc',
        shortName: 'BTC'
      });
    }

    if (parentWalletCoin === 'bch' || !parentWalletCoin) {
      this.availableUnits.push({
        name: 'Bitcoin Cash',
        id: 'bch',
        shortName: 'BCH'
      });
    }
    if (parentWalletCoin === 'eth' || !parentWalletCoin) {
      this.availableUnits.push({
        name: 'Eth',
        id: 'eth',
        shortName: 'ETH'
      });
    }
    if (parentWalletCoin === 'try' || !parentWalletCoin) {
      this.availableUnits.push({
        name: 'TRY',
        id: 'try',
        shortName: 'TRY'
      });
    }
    this.unitIndex = 0;

    if (this.navParams.data.coin) {
      let coins = this.navParams.data.coin.split(',');
      let newAvailableUnits = [];

      _.each(coins, (c: string) => {
        let coin = _.find(this.availableUnits, {
          id: c
        });
        if (!coin) {
          this.logger.warn(
            'Could not find desired coin:' + this.navParams.data.coin
          );
        } else {
          newAvailableUnits.push(coin);
        }
      });

      if (newAvailableUnits.length > 0) {
        this.availableUnits = newAvailableUnits;
      }
    }

    //  currency have preference
    let fiatName;
    if (this.navParams.data.currency) {
      this.fiatCode = this.navParams.data.currency;
      this.altUnitIndex = this.unitIndex;
      this.unitIndex = this.availableUnits.length;
    } else {
      this.fiatCode = this.config.wallet.settings.alternativeIsoCode || 'USD';
      fiatName = this.config.wallet.settings.alternativeName || this.fiatCode;
      this.altUnitIndex = this.availableUnits.length;
    }

    this.availableUnits.push({
      name: fiatName || this.fiatCode,
      // TODO
      id: this.fiatCode,
      shortName: this.fiatCode,
      isFiat: true
    });

    if (this.navParams.data.fixedUnit) {
      this.fixedUnit = true;
    }
  }

  private paste(value: string): void {
    this.zone.run(() => {
      this.expression = value;
      this.processAmount();
      this.changeDetectorRef.detectChanges();
    });
  }

  private getNextView() {
    let nextPage;
    switch (this.navParams.data.nextPage) {
      case 'CustomAmountPage':
        nextPage = CustomAmountPage;
        break;
      default:
        // hide send max for eth wallets
        if (
          this.navParams.data.coin !== 'eth' &&
          this.navParams.data.coin !== 'try'
        )
          this.showSendMax = true;
        nextPage = ConfirmPage;
    }
    return nextPage;
  }

  public processClipboard(): void {
    if (!this.platformProvider.isElectron) return;

    let value = this.electronProvider.readFromClipboard();

    if (value && this.evaluate(value) > 0) this.paste(this.evaluate(value));
  }

  public sendMax(): void {
    this.useSendMax = true;
    if (!this.wallet) {
      return this.finish();
    }
    let maxAmount;
    if (this.wallet.coin == 'eth' || this.wallet.coin == 'try') {
      maxAmount = this.txFormatProvider.weiToUnit(
        this.wallet.status.availableBalanceSat
      );
    } else {
      maxAmount = this.txFormatProvider.satToUnit(
        this.wallet.status.availableBalanceSat
      );
    }

    this.zone.run(() => {
      this.expression = this.availableUnits[this.unitIndex].isFiat
        ? this.toFiat(maxAmount, this.wallet.coin).toFixed(2)
        : maxAmount;
      this.processAmount();
      this.changeDetectorRef.detectChanges();
      this.finish();
    });
  }

  public isSendMaxButtonShown() {
    return !this.expression && !this.requestingAmount && this.showSendMax;
  }

  public pushDigit(digit: string, isHardwareKeyboard?: boolean): void {
    this.useSendMax = false;
    if (digit === 'delete') {
      return this.removeDigit();
    }
    if (this.isSendMaxButtonShown() && digit === '0' && !isHardwareKeyboard) {
      return this.sendMax();
    }
    if (
      this.expression &&
      this.expression.length >= this.LENGTH_EXPRESSION_LIMIT
    )
      return;
    this.zone.run(() => {
      this.expression = (this.expression + digit).replace('..', '.');
      this.processAmount();
      this.changeDetectorRef.detectChanges();
    });
  }
  // delete input characters
  public removeDigit(): void {
    // start tracking changes to the expression element
    this.zone.run(() => {
      this.expression = this.expression.slice(0, -1);
      this.processAmount();
      this.changeDetectorRef.detectChanges();
    });
  }

  public pushOperator(operator: string): void {
    if (!this.expression || this.expression.length == 0) return;
    this.zone.run(() => {
      this.expression = this._pushOperator(this.expression, operator);
      this.changeDetectorRef.detectChanges();
    });
  }

  private _pushOperator(val: string, operator: string) {
    if (!this.isOperator(_.last(val))) {
      return val + operator;
    } else {
      return val.slice(0, -1) + operator;
    }
  }

  // check if the last character of the letter is an operator  eg: *+X-
  private isOperator(val: string): boolean {
    const regex = /[\/\-\+\x\*]/;
    return regex.test(val);
  }

  private isExpression(val: string): boolean {
    const regex = /^\.?\d+(\.?\d+)?([\/\-\+\*x]\d?\.?\d+)+$/;
    return regex.test(val);
  }

  private processAmount(): void {
    let formatedValue = this.format(this.expression);
    let result = this.evaluate(formatedValue);
    this.allowSend = this.onlyIntegers
      ? _.isNumber(result) && +result > 0 && Number.isInteger(+result)
      : _.isNumber(result) && +result > 0;

    if (_.isNumber(result)) {
      this.globalResult = this.isExpression(this.expression)
        ? '= ' + this.processResult(result)
        : '';

      if (this.availableUnits[this.unitIndex].isFiat) {
        let a = this.fromFiat(result);
        if (a) {
          this.alternativeAmount = this.txFormatProvider.formatAmount(
            a * this.unitToCoin,
            true
          );
        } else {
          this.alternativeAmount = result ? 'N/A' : null;
          this.allowSend = false;
        }
      } else {
        this.alternativeAmount = this.filterProvider.formatFiatAmount(
          this.toFiat(result)
        );
      }
    }
  }

  private processResult(val): number {
    if (this.availableUnits[this.unitIndex].isFiat)
      return this.filterProvider.formatFiatAmount(val);
    else
      return this.txFormatProvider.formatAmount(
        val.toFixed(this.unitDecimals) * this.unitToCoin,
        true
      );
  }

  private fromFiat(val, coin?: string): number {
    coin = coin || this.availableUnits[this.altUnitIndex].id;
    return parseFloat(
      (
        this.rateProvider.fromFiat(val, this.fiatCode, coin) * this.coinToUnit
      ).toFixed(this.unitDecimals)
    );
  }

  private toFiat(val: number, coin?: Coin): number {
    if (!this.rateProvider.getRate(this.fiatCode)) return undefined;
    return parseFloat(
      this.rateProvider
        .toFiat(
          val * this.unitToCoin,
          this.fiatCode,
          coin || this.availableUnits[this.unitIndex].id
        )
        .toFixed(2)
    );
  }

  // format incoming character
  private format(val: string): string {
    if (!val) return undefined;

    let result = val.toString();
    if (this.isOperator(_.last(val))) result = result.slice(0, -1);
    return result.replace('x', '*');
  }

  private evaluate(val: string) {
    let result;
    try {
      result = eval(val);
    } catch (e) {
      return 0;
    }
    if (!_.isFinite(result)) return 0;
    return result;
  }

  public finish(): void {
    let unit = this.availableUnits[this.unitIndex];
    let _amount = this.evaluate(this.format(this.expression));
    let coin = unit.id;
    let data;

    if (unit.isFiat) {
      coin = this.availableUnits[this.altUnitIndex].id;
    }

    if (this.navParams.data.nextPage) {
      const amount = this.useSendMax ? null : _amount;

      data = {
        id: this._id,
        amount,
        currency: unit.id.toUpperCase(),
        coin,
        useSendMax: this.useSendMax
      };
    } else {
      let amount = _amount;
      amount = unit.isFiat
        ? (this.fromFiat(amount) * this.unitToCoin).toFixed(0)
        : (amount * this.unitToCoin).toFixed(0);

      data = {
        recipientType: this.recipientType,
        amount,
        toAddress: this.toAddress,
        name: this.name,
        email: this.email,
        color: this.color,
        coin,
        useSendMax: this.useSendMax,
        description: this.description
      };

      if (unit.isFiat) {
        data.fiatAmount = _amount;
        data.fiatCode = this.fiatCode;
      }
    }
    this.useSendMax = null;
    this.navCtrl.push(this.nextView, data);
  }

  private updateUnitUI(): void {
    this.unit = this.availableUnits[this.unitIndex].shortName;
    this.alternativeUnit = this.availableUnits[this.altUnitIndex].shortName;
    this.processAmount();
    this.logger.debug(
      'Update unit coin @amount unit:' +
        this.unit +
        ' alternativeUnit:' +
        this.alternativeUnit
    );
  }

  private resetValues(): void {
    this.expression = '';
    this.globalResult = '';
    this.alternativeAmount = null;
  }

  public changeUnit(): void {
    if (this.fixedUnit) return;

    this.unitIndex++;
    if (this.unitIndex >= this.availableUnits.length) this.unitIndex = 0;

    if (this.availableUnits[this.unitIndex].isFiat) {
      // Always return to BTC... TODO?
      this.altUnitIndex = 0;
    } else {
      this.altUnitIndex = _.findIndex(this.availableUnits, {
        isFiat: true
      });
    }

    this.resetValues();

    this.zone.run(() => {
      this.updateUnitUI();
      this.changeDetectorRef.detectChanges();
    });
  }
}
