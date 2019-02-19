import { async, ComponentFixture } from '@angular/core/testing';

import { Subject } from 'rxjs';

import { TestUtils } from '../../test';
import { ScanPage } from './scan';

describe('ScanPage', () => {
  let fixture: ComponentFixture<ScanPage>;
  let instance;

  beforeEach(async(() =>
    TestUtils.configurePageTestingModule([ScanPage]).then(testEnv => {
      fixture = testEnv.fixture;
      instance = testEnv.instance;
      instance.loadCamera = () => {};
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
        instance.platform.resume = new Subject();
        instance.ionViewWillEnter();
        instance.ionViewDidLoad();
        expect(spy).toHaveBeenCalled();
      });
    });

    describe('ionViewWillLeave', () => {
      it('should set default status bar styling on iOS', () => {
        instance.platform.is.and.returnValue(true);
        instance.scanner.resetScan = () => {};
        const spy = spyOn(instance.statusBar, 'styleDefault');
        instance.platform.resume = new Subject();
        instance.ionViewWillLeave();
        instance.ionViewDidLoad();
        expect(spy).toHaveBeenCalled();
      });
    });
  });
});
