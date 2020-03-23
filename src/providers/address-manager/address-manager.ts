/**
 * Generated class for the AddressManagerProvider provider.
 * See https://angular.io/guide/dependency-injection for more info on providers
 * and Angular DI.
 */
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

// providers
import { BwcErrorProvider } from '../../providers/bwc-error/bwc-error';
import { Logger } from '../../providers/logger/logger';
import { PersistenceProvider } from '../../providers/persistence/persistence';
import { WalletProvider } from '../../providers/wallet/wallet';

import * as _ from 'lodash';

@Injectable()
export class AddressManagerProvider {
  constructor(
    private logger: Logger,
    private persistenceProvider: PersistenceProvider,
    private walletProvider: WalletProvider,
    private translate: TranslateService,
    // private addressProvider: AddressProvider,
    private bwcError: BwcErrorProvider
  ) {
    this.logger.debug('AddressManagerProvider initialized');
  }

  /**
   * Get address
   * @param  {boolean}       newAddr whether generate a new address
   */
  public async getAddress(wallet, newAddr?: boolean): Promise<any> {
    this.logger.debug('-----getAddress');

    return new Promise((resolve, reject) => {
      this.walletProvider
        .getAddress(wallet, newAddr)
        .then(addr => {
          return resolve(addr);
        })
        .catch(err => {
          this.logger.warn(this.bwcError.msg(err, 'Server Error'));
          return reject(err);
        });
    });
  }

  public list(wallet): Promise<any> {
    return new Promise((resolve, reject) => {
      this.persistenceProvider
        .getAddressManager(wallet.id)
        .then(am => {
          if (am && _.isString(am)) am = JSON.parse(am);

          am = am || {};

          return resolve(am);
        })
        .catch(() => {
          let msg = this.translate.instant(
            'Could not get the Address Manager of this wallet'
          );
          return reject(msg);
        });
    });
  }

  public add(wallet, entry): Promise<any> {
    return new Promise((resolve, reject) => {
      this.persistenceProvider
        .getAddressManager(wallet.id)
        .then(am => {
          if (am && _.isString(am)) am = JSON.parse(am);
          am = am || {};
          if (_.isArray(am)) am = {}; // No array
          if (am[entry.address]) {
            let msg = this.translate.instant('Entry already exist');
            return reject(msg);
          }
          am[entry.address] = entry;
          this.persistenceProvider
            .setAddressManager(wallet.id, JSON.stringify(am))
            .then(() => {
              this.list(wallet)
                .then(am => {
                  return resolve(am);
                })
                .catch(err => {
                  return reject(err);
                });
            })
            .catch(() => {
              let msg = this.translate.instant('Error adding new entry');
              return reject(msg);
            });
        })
        .catch(err => {
          return reject(err);
        });
    });
  }

  public remove(wallet, addr): Promise<any> {
    return new Promise((resolve, reject) => {
      this.persistenceProvider
        .getAddressManager(wallet.id)
        .then(am => {
          if (am && _.isString(am)) am = JSON.parse(am);
          am = am || {};
          if (_.isEmpty(am)) {
            let msg = this.translate.instant('Address manager is empty');
            return reject(msg);
          }
          if (!am[addr]) {
            let msg = this.translate.instant('Entry does not exist');
            return reject(msg);
          }
          delete am[addr];
          this.persistenceProvider
            .setAddressManager(wallet.id, JSON.stringify(am))
            .then(() => {
              this.list(wallet)
                .then(am => {
                  return resolve(am);
                })
                .catch(err => {
                  return reject(err);
                });
            })
            .catch(() => {
              let msg = this.translate.instant('Error deleting entry');
              return reject(msg);
            });
        })
        .catch(err => {
          return reject(err);
        });
    });
  }

  public clear(wallet): Promise<any> {
    return new Promise((resolve, reject) => {
      this.persistenceProvider
        .removeAddressManager(wallet.id)
        .then(() => {
          return resolve();
        })
        .catch(() => {
          let msg = this.translate.instant('Error deleting address manager');
          return reject(msg);
        })
        .catch(() => {
          let msg = this.translate.instant('Error deleting address manager');
          return reject(msg);
        });
    });
  }
}
