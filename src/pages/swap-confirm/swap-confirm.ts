import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ViewController } from 'ionic-angular';
import { Logger } from '../../providers/logger/logger';

/**
 * Generated class for the SwapConfirmPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-swap-confirm',
  templateUrl: 'swap-confirm.html',
})
export class SwapConfirmPage {
	public exchangeFrom: string;
	public exchangeTo: string;
	public address: string;
	public gasPrice: string;
	public okText: string;
  public cancelText: string;

  constructor(
  	private viewCtrl: ViewController,
    private logger: Logger,
		private translate: TranslateService
	) {
  	this.okText = this.translate.instant('Exchange');
    this.cancelText = this.translate.instant('Cancel');
    this.exchangeFrom = this.viewCtrl.data.exchangeFrom;
    this.exchangeTo = this.viewCtrl.data.exchangeTo;
    this.address = this.viewCtrl.data.address;
    this.gasPrice = this.viewCtrl.data.gasPrice;
  }

  ionViewDidLoad() {
    this.logger.debug('ionViewDidLoad SwapConfirmPage');
  }

  public confirm(): void{
  	this.logger.debug('----confirm')
  	this.viewCtrl.dismiss({ isConfrimed: true})
  }

  public cancel(): void{
  	this.viewCtrl.dismiss();
  }
}
