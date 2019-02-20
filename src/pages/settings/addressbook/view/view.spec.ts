import { async, ComponentFixture } from '@angular/core/testing';

import { TestUtils } from '../../../../test';
import { AddressbookViewPage } from './view';

describe('AddressbookViewPage', () => {
  let fixture: ComponentFixture<AddressbookViewPage>;
  let instance;

  beforeEach(async(() =>
    TestUtils.configurePageTestingModule([AddressbookViewPage]).then(
      testEnv => {
        fixture = testEnv.fixture;
        instance = testEnv.instance;
        instance.navParams = {
          data: {
            contact: {
              address: '',
              name: '',
              email: ''
            }
          }
        };
        fixture.detectChanges();
      }
    )));
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
