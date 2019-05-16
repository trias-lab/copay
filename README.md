# Trias Wallet

[![CircleCI](https://img.shields.io/circleci/project/github/trias-lab/wallet/master.svg)](https://circleci.com/gh/trias-lab/wallet/)

Trias Wallet is a secure bitcoin wallet, based on [Copay of Bitpay](https://github.com/bitpay/copay).

In addition to retaining some of its original excellent features, we redesigned it to meet the needs of our users, aiming to develop a simple, easy-to-use and secure wallet.

## Main Features

### What features does Copay have?
- Bitcoin and Bitcoin Cash coin support
- Multiple wallet creation and management in-app
- Intuitive, multisignature security for personal or shared wallets
- Easy spending proposal flow for shared wallets and group payments
- BIP32 Hierarchical deterministic (HD) address generation and wallet backups
- Device-based security: all private keys are stored locally, not in the cloud
- Support for Bitcoin testnet wallets
- Synchronous access across all major mobile and desktop platforms
- Payment protocol (BIP70-BIP73) support: easily-identifiable payment requests and verifiable, secure bitcoin payments
- Support for over 150 currency pricing options and unit denomination in BTC or bits
- Mnemonic (BIP39) support for wallet backups
- Paper wallet sweep support (BIP38)
- Email notifications for payments and transfers
- Push notifications (only available for ios and android versions)
- Customizable wallet naming and background colors
- Multiple languages supported
- Available for iOS, Android, Windows Phone, Chrome App, Linux, Windows and OS X devices

### How about Trias Wallet?
- Add TRY and ETH support
- Add ETH/Token swap
- Modify the flow of creation of the wallets. Create 4 wallets (BTC, BCH, ETH, TRY) by default, with a same mnemonic, so that it's easy to manage them。
- Simplify password management. The user only needs to remember a password for unlocking the application, encrypting the wallet, confirming the transaction, and other operations that require authorization. Besides, the password will not be stored locally or in the cloud.
- Add management of addresses of the wallet on wallet detail page.
- No shared wallet any more.
- For now, only support IOS and Android. 
- Still in progress...

## Testing in a Browser

> **Note:** This method should only be used for development purposes. 

Clone the repo and open the directory:

```sh
git clone https://github.com/trias-lab/wallet.git
cd wallet
```

Ensure you have [Node](https://nodejs.org/) installed, then install and start Copay:

```sh
npm install
npm run apply:copay
npm run start
```

Visit [`localhost:8100`](http://localhost:8100/) to view the app.

## Unit Tests (Karma & Protractor)

To run the tests, run:

```
 npm run test
```

## Testing on Real Devices

It's recommended that all final testing be done on a real device – both to assess performance and to enable features that are unavailable to the emulator (e.g. a device camera).

### Android

Follow the [Cordova Android Platform Guide](https://cordova.apache.org/docs/en/latest/guide/platforms/android/) to set up your development environment.

When your developement enviroment is ready, run the `start:android` package script.

```sh
npm run apply:copay
npm run prepare:copay
npm run start:android
```

### iOS

Follow the [Cordova iOS Platform Guide](https://cordova.apache.org/docs/en/latest/guide/platforms/ios/) to set up your development environment.

When your developement enviroment is ready, run the `start:ios` package script.

```sh
npm run apply:copay
npm run prepare:copay
npm run start:ios
```

## Build App Bundles

Before building the release version for a platform, run the `clean-all` command to delete any untracked files in your current working directory. (Be sure to stash any uncommited changes you've made.) This guarantees consistency across builds for the current state of this repository.

The `final` commands build the production version of the app, and bundle it with the release version of the platform being built.

### Android

```sh
npm run clean-all
npm install
npm run apply:copay
npm run prepare:copay
npm run final:android
```

### iOS

```sh
npm run clean-all
npm install
npm run apply:copay
npm run prepare:copay
npm run final:ios
```

## Configuration

### Enable External Services

To enable external services, set the `COPAY_EXTERNAL_SERVICES_CONFIG_LOCATION` or `BITPAY_EXTERNAL_SERVICES_CONFIG_LOCATION` environment variable to the location of your configuration before running the `apply` task.

```sh
COPAY_EXTERNAL_SERVICES_CONFIG_LOCATION="~/.copay/externalServices.json" npm run apply:copay
# or
BITPAY_EXTERNAL_SERVICES_CONFIG_LOCATION="~/.bitpay/externalServices.json" npm run apply:bitpay
```

## A Note on Production Readiness

While Trias is being used in production in private, permissioned
environments, we are still working actively to harden and audit it in preparation
for use in public blockchains.
We are also still making breaking changes to the protocol and the APIs.
Thus, we tag the releases as _alpha software_.

In any case, if you intend to run Trias in production,
please [contact us](mailto:contact@trias.one) and [join the chat](https://www.trias.one).

## Security

To report a security vulnerability, [bug report](mailto:contact@trias.one)

## Contributing

All code contributions and document maintenance are temporarily responsible for TriasLab.

Trias are now developing at a high speed and we are looking forward to working with quality partners who are interested in Trias. If you want to join，please contact us:

- [Telegram](https://t.me/triaslab)
- [Medium](https://medium.com/@Triaslab)
- [BiYong](https://0.plus/#/triaslab)
- [Twitter](https://twitter.com/triaslab)
- [Gitbub](https://github.com/trias-lab/Documentation)
- [Reddit](https://www.reddit.com/r/Trias_Lab)
- [More](https://www.trias.one/)
- [Email](mailto:contact@trias.one)

### Upgrades

Trias is responsible for the code and documentation upgrades for all Trias modules. In an effort to avoid accumulating technical debt prior to Beta, we do not guarantee that data breaking changes (ie. bumps in the MINOR version) will work with existing Trias blockchains. In these cases you will have to start a new blockchain, or write something custom to get the old data into the new chain.

## Resources

### Research

- [The latest paper](https://www.contact@trias.one/attachment/Trias-whitepaper%20attachments.zip)
- [Project process](https://trias.one/updates/project)
- [Original Whitepaper](https://trias.one/whitepaper)
- [News room](https://trias.one/updates/recent)
