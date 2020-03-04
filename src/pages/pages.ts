/* Pages */
import { ImportWalletPage } from '../pages/add/import-wallet/import-wallet';
import { BackupGamePage } from '../pages/backup/backup-game/backup-game';
import { BackupRequestPage } from '../pages/backup/backup-request/backup-request';
import { FinishModalPage } from '../pages/finish/finish';
import { DisclaimerPage } from '../pages/onboarding/disclaimer/disclaimer';
import { OnboardingPage } from '../pages/onboarding/onboarding';
import { PaperWalletPage } from '../pages/paper-wallet/paper-wallet';
import { SlideToAcceptPage } from '../pages/slide-to-accept/slide-to-accept';
import { SwapConfirmPage } from '../pages/swap-confirm/swap-confirm';
import { SwapPage } from '../pages/swap/swap';
import { TabsPage } from '../pages/tabs/tabs';
import { TxDetailsPage } from '../pages/tx-details/tx-details';
import { TxpDetailsPage } from '../pages/txp-details/txp-details';
import { SearchTxModalPage } from '../pages/wallet-details/search-tx-modal/search-tx-modal';
import { WalletBalancePage } from '../pages/wallet-details/wallet-balance/wallet-balance';
import { WalletDetailsPage } from '../pages/wallet-details/wallet-details';
import { WalletTabsPage } from '../pages/wallet-tabs/wallet-tabs';

/*Includes */
import { CardItemPage } from '../pages/includes/card-item/card-item';
import { GravatarPage } from '../pages/includes/gravatar/gravatar';
import { TxpPage } from '../pages/includes/txp/txp';

/* Tabs */
import { HomePage } from '../pages/home/home';
import { ReceivePage } from '../pages/receive/receive';
import { ScanPage } from '../pages/scan/scan';
import { SendPage } from '../pages/send/send';
import { SettingsPage } from '../pages/settings/settings';

/* Home */
import { ProposalsPage } from '../pages/home/proposals/proposals';

/* Settings */
import { PasswordModalPage } from '../pages/password-modal/password-modal';
import { PinPad } from '../pages/pin-pad/pin-pad.component';
import { AboutPage } from '../pages/settings/about/about';
import { SessionLogPage } from '../pages/settings/about/session-log/session-log';
import { AddressbookAddPage } from '../pages/settings/addressbook/add/add';
import { AddressbookPage } from '../pages/settings/addressbook/addressbook';
import { AddressbookModifyPage } from '../pages/settings/addressbook/modify/modify';
import { AddressbookViewPage } from '../pages/settings/addressbook/view/view';

import { AdvancedPage } from '../pages/settings/advanced/advanced';
import { AltCurrencyPage } from '../pages/settings/alt-currency/alt-currency';
import { FeePolicyPage } from '../pages/settings/fee-policy/fee-policy';
import { LanguagePage } from '../pages/settings/language/language';
import { NotificationsPage } from '../pages/settings/notifications/notifications';
import { SharePage } from '../pages/settings/share/share';
import { AddressAddPage } from '../pages/wallet-details/add-address/add-address';

/* Wallet Settings */
import { WalletColorPage } from '../pages/settings/wallet-settings/wallet-color/wallet-color';
import { WalletNamePage } from '../pages/settings/wallet-settings/wallet-name/wallet-name';
import { WalletSettingsPage } from '../pages/settings/wallet-settings/wallet-settings';

/* Wallet Advanced Settings */
import { WalletDeletePage } from '../pages/settings/wallet-settings/wallet-settings-advanced/wallet-delete/wallet-delete';
import { WalletExportPage } from '../pages/settings/wallet-settings/wallet-settings-advanced/wallet-export/wallet-export';
import { WalletExtendedPrivateKeyPage } from '../pages/settings/wallet-settings/wallet-settings-advanced/wallet-information/wallet-extended-private-key/wallet-extended-private-key';
import { WalletInformationPage } from '../pages/settings/wallet-settings/wallet-settings-advanced/wallet-information/wallet-information';
import { WalletServiceUrlPage } from '../pages/settings/wallet-settings/wallet-settings-advanced/wallet-service-url/wallet-service-url';
import { WalletTransactionHistoryPage } from '../pages/settings/wallet-settings/wallet-settings-advanced/wallet-transaction-history/wallet-transaction-history';

/* Send */
import { AmountPage } from '../pages/send/amount/amount';
import { ChooseFeeLevelPage } from '../pages/send/choose-fee-level/choose-fee-level';
import { ConfirmPage } from '../pages/send/confirm/confirm';

/* Receive */
import { CustomAmountPage } from '../pages/receive/custom-amount/custom-amount';
import { WideHeaderPage } from './templates/wide-header-page/wide-header-page';
import { WalletTabsChild } from './wallet-tabs/wallet-tabs-child';

export const PAGES = [
  AmountPage,

  AddressbookPage,
  AddressAddPage,
  AddressbookAddPage,
  AddressbookViewPage,
  AddressbookModifyPage,
  AboutPage,
  AdvancedPage,
  AltCurrencyPage,
  BackupRequestPage,
  ChooseFeeLevelPage,
  SharePage,
  ImportWalletPage,
  BackupGamePage,
  ConfirmPage,
  CustomAmountPage,
  DisclaimerPage,
  GravatarPage,
  HomePage,
  LanguagePage,
  OnboardingPage,
  PaperWalletPage,
  PinPad,
  PasswordModalPage,
  ProposalsPage,
  ReceivePage,
  ScanPage,
  SendPage,
  SettingsPage,
  NotificationsPage,
  FeePolicyPage,
  SearchTxModalPage,
  SessionLogPage,
  FinishModalPage,
  TabsPage,
  TxpDetailsPage,
  TxDetailsPage,
  TxpPage,
  WalletSettingsPage,
  WalletNamePage,
  WalletColorPage,
  WalletInformationPage,
  WalletExportPage,
  WalletServiceUrlPage,
  WalletTransactionHistoryPage,
  WalletDeletePage,
  WalletExtendedPrivateKeyPage,
  WalletDetailsPage,
  WalletTabsChild,
  WalletTabsPage,
  WalletBalancePage,
  WideHeaderPage,
  CardItemPage,
  SlideToAcceptPage,
  SwapPage,
  SwapConfirmPage
];
