import { EnvironmentSchema } from './schema';

/**
 * Environment: prod
 */
const env: EnvironmentSchema = {
  name: 'production',
  enableAnimations: true,
  ratesAPI: {
    btc: 'https://bitpay.com/api/rates',
    bch: 'https://bitpay.com/api/rates/bch',
    eth: 'http://192.168.1.171:3232/bws/api/v1/rates/eth',
    tri: 'http://192.168.1.171:3232/bws/api/v1/rates/tri'
  },
  activateScanner: true
};

export default env;
