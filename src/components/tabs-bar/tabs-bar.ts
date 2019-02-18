import { Component, Input } from '@angular/core';
import { NavController } from 'ionic-angular';

// providers
import { Logger } from '../../providers/logger/logger';

// pages
import { HomePage } from '../../pages/home/home';
import { SettingsPage } from '../../pages/settings/settings';

@Component({
  selector: 'tabs-bar',
  templateUrl: `tabs-bar.html`
})
export class TabsBarComponent {
  @Input()
  selectedTab: string;

  constructor(private navCtrl: NavController, private logger: Logger) {
    this.logger.debug('Hello TabsBarComponent Component');
    // this.selectedTab = "home";
  }

  public select(tabname) {
    if (tabname == 'home') {
      this.navCtrl.setPages([{ page: HomePage }], {});
    }
    if (tabname == 'settings') {
      this.navCtrl.setPages([{ page: SettingsPage }], {});
    }
  }
}
