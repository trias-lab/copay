import { Injectable } from '@angular/core';
import { Logger } from '../../providers/logger/logger';
import { PersistenceProvider } from '../persistence/persistence';

import * as _ from 'lodash';

export interface Config {
  limits: {
    totalCopayers: number;
    mPlusN: number;
  };

  wallet: {
    useLegacyAddress: boolean;
    requiredCopayers: number;
    totalCopayers: number;
    spendUnconfirmed: boolean;
    reconnectDelay: number;
    idleDurationMin: number;
    settings: {
      unitName: string;
      unitToSatoshi: number;
      unitToWei: number;
      unitDecimals: number;
      unitCode: string;
      alternativeName: string;
      alternativeIsoCode: string;
      defaultLanguage: string;
      feeLevel: string;
    };
  };

  bws: {
    url: string;
  };

  download: {
    bitpay: {
      url: string;
    };
    copay: {
      url: string;
    };
  };

  lock: {
    pin: boolean;
    fingerprint: any; // "Face ID" / "Touch ID" / null
  };

  pushNotificationsEnabled: boolean;

  inAppNotificationsEnabled: boolean;

  desktopNotificationsEnabled: boolean;

  confirmedTxsNotifications: {
    enabled: boolean;
  };

  emailNotifications: {
    enabled: boolean;
    email: string;
  };

  emailFor?: any;
  bwsFor?: any;
  aliasFor?: any;
  colorFor?: any;
  touchIdFor?: any;

  log: {
    weight: number;
  };

  blockExplorerUrl: {
    btc: string;
    bch: string;
  };
}

@Injectable()
export class ConfigProvider {
  public configCache: Config;
  public configDefault: Config;

  constructor(
    private logger: Logger,
    private persistence: PersistenceProvider
  ) {
    this.logger.debug('ConfigProvider initialized');
    this.configDefault = {
      // wallet limits
      limits: {
        totalCopayers: 6,
        mPlusN: 100
      },

      // wallet default config
      wallet: {
        useLegacyAddress: false,
        requiredCopayers: 2,
        totalCopayers: 3,
        spendUnconfirmed: false,
        reconnectDelay: 5000,
        idleDurationMin: 4,
        settings: {
          unitName: 'BTC',
          unitToSatoshi: 100000000,
          unitToWei: 1000000000000000000,
          unitDecimals: 8,
          unitCode: 'btc',
          alternativeName: 'US Dollar',
          alternativeIsoCode: 'USD',
          defaultLanguage: '',
          feeLevel: 'normal'
        }
      },

      // Bitcore wallet service URL
      bws: {
        url: 'http://tbws.trias.one:3232/bws/api'
      },

      download: {
        bitpay: {
          url: 'https://bitpay.com/wallet'
        },
        copay: {
          url: 'https://copay.io/#download'
        }
      },

      lock: {
        pin: false,
        fingerprint: null
      },

      pushNotificationsEnabled: true,

      inAppNotificationsEnabled: true,

      desktopNotificationsEnabled: true,

      confirmedTxsNotifications: {
        enabled: true
      },

      emailNotifications: {
        enabled: false,
        email: ''
      },

      log: {
        weight: 3
      },

      blockExplorerUrl: {
        btc: 'insight.bitpay.com',
        bch: 'bch-insight.bitpay.com/#'
      }
    };
  }

  public load() {
    return new Promise((resolve, reject) => {
      this.persistence
        .getConfig()
        .then((config: Config) => {
          if (!_.isEmpty(config)) {
            this.configCache = _.clone(config);
            this.backwardCompatibility();
          } else {
            this.configCache = _.clone(this.configDefault);
          }
          this.logImportantConfig(this.configCache);
          resolve();
        })
        .catch(err => {
          this.logger.error('Error Loading Config');
          reject(err);
        });
    });
  }

  private logImportantConfig(config: Config): void {
    const spendUnconfirmed = config.wallet.spendUnconfirmed;
    const useLegacyAddress = config.wallet.useLegacyAddress;
    const lockMethod =
      config && config.lock && config.lock.fingerprint
        ? 'PIN and ' + config.lock.fingerprint
        : 'PIN';

    this.logger.debug(
      'Config | spendUnconfirmed: ' +
        spendUnconfirmed +
        ' - useLegacyAddress: ' +
        useLegacyAddress +
        ' - lockMethod: ' +
        lockMethod
    );
  }

  /**
   * @param newOpts object or string (JSON)
   */
  public set(newOpts) {
    const config = _.cloneDeep(this.configDefault);

    if (_.isString(newOpts)) {
      newOpts = JSON.parse(newOpts);
    }
    _.merge(config, this.configCache, newOpts);
    this.configCache = config;
    this.persistence.storeConfig(this.configCache).then(() => {
      this.logger.info('Config saved');
    });
  }

  public get(): Config {
    return this.configCache;
  }

  public getDefaults(): Config {
    return this.configDefault;
  }

  private backwardCompatibility() {
    // these ifs are to avoid migration problems
    if (this.configCache.bws) {
      this.configCache.bws = this.configDefault.bws;
    }
    if (!this.configCache.wallet) {
      this.configCache.wallet = this.configDefault.wallet;
    }
    if (!this.configCache.wallet.settings.unitCode) {
      this.configCache.wallet.settings.unitCode = this.configDefault.wallet.settings.unitCode;
    }
    if (!this.configCache.pushNotificationsEnabled) {
      this.configCache.pushNotificationsEnabled = this.configDefault.pushNotificationsEnabled;
    }
    if (!this.configCache.inAppNotificationsEnabled) {
      this.configCache.inAppNotificationsEnabled = this.configDefault.inAppNotificationsEnabled;
    }
    if (!this.configCache.desktopNotificationsEnabled) {
      this.configCache.desktopNotificationsEnabled = this.configDefault.desktopNotificationsEnabled;
    }
    if (!this.configCache.emailNotifications) {
      this.configCache.emailNotifications = this.configDefault.emailNotifications;
    }
    if (!this.configCache.lock) {
      this.configCache.lock = this.configDefault.lock;
    }
    if (!this.configCache.confirmedTxsNotifications) {
      this.configCache.confirmedTxsNotifications = this.configDefault.confirmedTxsNotifications;
    }

    if (this.configCache.wallet.settings.unitCode == 'bit') {
      // Convert to BTC. Bits will be disabled
      this.configCache.wallet.settings.unitName = this.configDefault.wallet.settings.unitName;
      this.configCache.wallet.settings.unitToSatoshi = this.configDefault.wallet.settings.unitToSatoshi;
      this.configCache.wallet.settings.unitToWei = this.configDefault.wallet.settings.unitToWei;
      this.configCache.wallet.settings.unitDecimals = this.configDefault.wallet.settings.unitDecimals;
      this.configCache.wallet.settings.unitCode = this.configDefault.wallet.settings.unitCode;
    }
  }
}
