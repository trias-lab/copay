import { Component, ViewChild } from '@angular/core';
import { HomePage } from '../home/home';
// import { ScanPage } from '../scan/scan';
import { SettingsPage } from '../settings/settings';

@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage {
  @ViewChild('tabs')
  tabs;

  homeRoot = HomePage;
  // scanRoot = ScanPage;
  settingsRoot = SettingsPage;
}
