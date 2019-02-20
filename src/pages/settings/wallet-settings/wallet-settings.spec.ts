import { async, ComponentFixture } from '@angular/core/testing';

import { TestUtils } from '../../../test';
import { WalletSettingsPage } from './wallet-settings';

describe('WalletSettingsPage', () => {
  let fixture: ComponentFixture<WalletSettingsPage>;
  let instance;

  beforeEach(async(() =>
    TestUtils.configurePageTestingModule([WalletSettingsPage]).then(testEnv => {
      fixture = testEnv.fixture;
      instance = testEnv.instance;
      fixture.detectChanges();
    })));
  afterEach(() => {
    fixture.destroy();
  });

  describe('Lifecycle Hooks', () => {
    describe('ionViewWillEnter', () => {
      it('should style the status bar for light content on iOS', () => {
        instance.platform.is.and.returnValue(true);
        const spy = spyOn(instance.statusBar, 'styleLightContent');
        instance.ionViewWillEnter();
        expect(spy).toHaveBeenCalled();
      });
    });

    describe('ionViewWillLeave', () => {
      it('should set default status bar styling on iOS', () => {
        instance.platform.is.and.returnValue(true);
        const spy = spyOn(instance.statusBar, 'styleDefault');
        instance.ionViewWillLeave();
        expect(spy).toHaveBeenCalled();
      });
    });
  });
});
