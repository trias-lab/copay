import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import env from '../../environments';
import { Logger } from '../../providers/logger/logger';

@Injectable()
export class RateProvider {
  private rates;
  private alternatives;
  private ratesBCH;
  private ratesETH;
  private ratesTRI;
  private ratesBtcAvailable: boolean;
  private ratesBchAvailable: boolean;
  private ratesEthAvailable: boolean;
  private ratesTriAvailable: boolean;

  private SAT_TO_BTC: number;
  private BTC_TO_SAT: number;
  private WEI_TO_ETH: number;
  private ETH_TO_WEI: number;

  private rateServiceUrl = env.ratesAPI.btc;
  private bchRateServiceUrl = env.ratesAPI.bch;
  private ethRateServiceUrl = env.ratesAPI.eth;
  private triRateServiceUrl = env.ratesAPI.try;

  constructor(private http: HttpClient, private logger: Logger) {
    this.logger.debug('RateProvider initialized');
    this.rates = {};
    this.alternatives = [];
    this.ratesBCH = {};
    this.ratesETH = {};
    this.ratesTRI = {};
    this.SAT_TO_BTC = 1 / 1e8;
    this.BTC_TO_SAT = 1e8;
    this.WEI_TO_ETH = 1 / 1e18;
    this.ETH_TO_WEI = 1e18;
    this.ratesBtcAvailable = false;
    this.ratesBchAvailable = false;
    this.ratesEthAvailable = false;
    this.ratesTriAvailable = false;
    this.updateRatesBtc();
    this.updateRatesBch();
    this.updateRatesEth();
    this.updateRatesTri();
  }

  public updateRatesBtc(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getBTC()
        .then(dataBTC => {
          _.each(dataBTC, currency => {
            this.rates[currency.code] = currency.rate;
            this.alternatives.push({
              name: currency.name,
              isoCode: currency.code,
              rate: currency.rate
            });
          });
          this.ratesBtcAvailable = true;
          resolve();
        })
        .catch(errorBTC => {
          this.logger.error(errorBTC);
          reject(errorBTC);
        });
    });
  }

  public updateRatesBch(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getBCH()
        .then(dataBCH => {
          _.each(dataBCH, currency => {
            this.ratesBCH[currency.code] = currency.rate;
          });
          this.ratesBchAvailable = true;
          resolve();
        })
        .catch(errorBCH => {
          this.logger.error(errorBCH);
          reject(errorBCH);
        });
    });
  }

  public updateRatesEth(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getETH()
        .then(dataETH => {
          _.each(dataETH, currency => {
            this.ratesETH[currency.code] = currency.rate;
          });
          this.ratesEthAvailable = true;
          resolve();
        })
        .catch(errorETH => {
          this.logger.error(errorETH);
          reject(errorETH);
        });
    });
  }

  public updateRatesTri(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getTRI()
        .then(data => {
          _.each(data, currency => {
            this.ratesTRI[currency.code] = currency.rate;
          });
          this.ratesTriAvailable = true;
          resolve();
        })
        .catch(error => {
          this.logger.error(error);
          reject(error);
        });
    });
  }

  public getBTC(): Promise<any> {
    return new Promise(resolve => {
      this.http.get(this.rateServiceUrl).subscribe(data => {
        resolve(data);
      });
    });
  }

  public getBCH(): Promise<any> {
    return new Promise(resolve => {
      this.http.get(this.bchRateServiceUrl).subscribe(data => {
        resolve(data);
      });
    });
  }

  public getETH(): Promise<any> {
    return new Promise(resolve => {
      this.http.get(this.ethRateServiceUrl).subscribe(data => {
        resolve(data);
      });
    });
  }

  public getTRI(): Promise<any> {
    return new Promise(resolve => {
      this.http.get(this.triRateServiceUrl).subscribe(data => {
        resolve(data);
      });
    });
  }

  public getRate(code: string, chain?: string): number {
    if (chain == 'eth') {
      // this.logger.info(this.ratesETH[code] + 'this.ratesETH[code]');
      return this.ratesETH[code];
    } else if (chain == 'try') {
      // this.logger.info(this.ratesTRI[code] + 'this.ratesTRI[code]');
      return this.ratesTRI[code];
    } else if (chain == 'bch') {
      // this.logger.info(this.ratesBCH[code] + 'this.ratesBCH[code]');
      return this.ratesBCH[code];
    } else {
      // this.logger.info(this.rates[code] + 'this.rates[code]');
      return this.rates[code];
    }
  }

  public getAlternatives() {
    return this.alternatives;
  }

  public isBtcAvailable() {
    return this.ratesBtcAvailable;
  }

  public isBchAvailable() {
    return this.ratesBchAvailable;
  }

  public isEthAvailable() {
    return this.ratesEthAvailable;
  }

  public isTriAvailable() {
    return this.ratesTriAvailable;
  }

  public toFiat(satoshis: number, code: string, chain: string): number {
    if (
      (!this.isBtcAvailable() && chain == 'btc') ||
      (!this.isBchAvailable() && chain == 'bch') ||
      (!this.isEthAvailable() && chain == 'eth') ||
      (!this.isTriAvailable() && chain == 'try')
    ) {
      return null;
    }
    if (chain == 'eth' || chain == 'try') {
      // this.logger.info(satoshis + ' eth-satoshis');
      // this.logger.info(this.getRate(code, chain) + 'eth_rate');
      return satoshis * this.WEI_TO_ETH * this.getRate(code, chain);
    } else {
      // this.logger.info(satoshis + 'btc-satoshis');
      // this.logger.info(this.getRate(code, chain) + 'btc_rate');
      return satoshis * this.SAT_TO_BTC * this.getRate(code, chain);
    }
  }

  public fromFiat(amount: number, code: string, chain: string): number {
    if (
      (!this.isBtcAvailable() && chain == 'btc') ||
      (!this.isBchAvailable() && chain == 'bch') ||
      (!this.isEthAvailable() && chain == 'eth') ||
      (!this.isTriAvailable() && chain == 'try')
    ) {
      return null;
    }
    if (chain == 'eth' || chain == 'try') {
      return (amount / this.getRate(code, chain)) * this.ETH_TO_WEI;
    }
    return (amount / this.getRate(code, chain)) * this.BTC_TO_SAT;
  }

  public listAlternatives(sort: boolean) {
    let alternatives = _.map(this.getAlternatives(), (item: any) => {
      return {
        name: item.name,
        isoCode: item.isoCode
      };
    });
    if (sort) {
      alternatives.sort((a, b) => {
        return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1;
      });
    }
    return _.uniqBy(alternatives, 'isoCode');
  }

  public whenRatesAvailable(chain: string): Promise<any> {
    return new Promise(resolve => {
      if (
        (this.ratesBtcAvailable && chain == 'btc') ||
        (this.ratesBchAvailable && chain == 'bch') ||
        (this.ratesEthAvailable && chain == 'eth') ||
        (this.ratesTriAvailable && chain == 'try')
      )
        resolve();
      else {
        if (chain == 'btc') {
          this.updateRatesBtc().then(() => {
            resolve();
          });
        }
        if (chain == 'bch') {
          this.updateRatesBch().then(() => {
            resolve();
          });
        }
        if (chain == 'eth') {
          this.updateRatesEth().then(() => {
            resolve();
          });
        }
        if (chain == 'try') {
          this.updateRatesTri().then(() => {
            resolve();
          });
        }
      }
    });
  }
}
