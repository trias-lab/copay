import { async, ComponentFixture } from '@angular/core/testing';

import { TestUtils } from '../../test';

import { TxDetailsPage } from './tx-details';

describe('TxDetailsPage', () => {
  let fixture: ComponentFixture<TxDetailsPage>;
  let instance;

  beforeEach(async(() =>
    TestUtils.configurePageTestingModule([TxDetailsPage]).then(testEnv => {
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

  describe('Methods', () => {
    describe('#saveMemoInfo', () => {
      it('should set btx note body to the new txMemo', async () => {
        instance.btx = { note: {} };
        instance.txMemo = 'new memo';
        await instance.saveMemoInfo();
        expect(instance.btx.note.body).toEqual('new memo');
      });
    });
  });
});
