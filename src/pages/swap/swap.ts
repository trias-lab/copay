import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Component } from '@angular/core';
import { 
  Events,
  Platform
  } from 'ionic-angular';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';

// providers
import { AddressManagerProvider } from '../../providers/address-manager/address-manager';
// import { BwcErrorProvider } from '../../providers/bwc-error/bwc-error';
import { Logger } from '../../providers/logger/logger';
// import { PopupProvider } from '../../providers/popup/popup';
import { ProfileProvider } from '../../providers/profile/profile';
// import { WalletProvider } from '../../providers/wallet/wallet';

@Component({
  selector: 'page-swap',
  templateUrl: 'swap.html',
})
export class SwapPage {
  public wallets;  
  public selectedWallet;
  public addrWithBalance;
  public selectedAddr;

  public tokens = [];
  public fromTokens = [];
  public toTokens = [];
  public fromCoin;
  public toCoin;
	public selectedFromCoin;
  public selectedToCoin;
  public fromQty:number;
  public toQty: number;
  public fromQtyEntered: number;
  public toQtyEntered: number;
  public ethQty: number;
  public tokenQty: number;
  public rate: number;

  public feeOpts;
  public selectedFee;  // Gas price of the transaction

  public WALLET_ID;  // Your fee sharing address
  public private_key;

  public showResult = false;
  public txSuccess = false;
  public txHash: string = '';  
  public txNotFinished: boolean = false;
  public message: string = '';

  private apiURL: string = 'https://ropsten-api.kyber.network/';
  // private apiURL: string = 'https://api.kyber.network/'; // when production

  private onResumeSubscription: Subscription;
  private onPauseSubscription: Subscription;

	constructor(
    private plt: Platform,
  	// private navCtrl: NavController, 
  	// private navParams: NavParams,
    private profileProvider: ProfileProvider,
    private events: Events,
  	private logger: Logger,
    private http: HttpClient,
    // private popupProvider: PopupProvider,
    // private walletProvider: WalletProvider,
    // private bwcError: BwcErrorProvider,
    // private translate: TranslateService,
    private am: AddressManagerProvider,
    // private formBuilder: FormBuilder,
	) {
    this.getSupportedTokens();

    this.feeOpts = ['low', 'medium', 'high']
    this.selectedFee = 'medium';
  }

  ionViewDidLoad(){
    this.logger.info('ionViewDidLoad SwapPage');
    this.setWallets()
    this.subscribeStatusEvents();
    this.onResumeSubscription = this.plt.resume.subscribe(() => {
      this.setWallets();
      this.subscribeStatusEvents();
    });
    this.onPauseSubscription = this.plt.pause.subscribe(() => {
      this.events.unsubscribe('status:updated');
    });
  }

  ngOnDestroy() {
    this.onResumeSubscription.unsubscribe();
    this.onPauseSubscription.unsubscribe();
  }

  private subscribeStatusEvents() {
    // Create, Join, Import and Delete -> Get Wallets -> Update Status for All Wallets -> Update recent transactions and txps
    this.events.subscribe('status:updated', () => {
      this.setWallets();
    });
  }

  private setWallets = _.debounce(
    () => {
      let wallets = this.profileProvider.getWallets();
      this.wallets = _.filter(wallets, (x: any) => {
        return x.credentials.coin == 'eth' && !x.needsBackup;
      });
      this.selectedWallet = this.wallets[0]
      this.getAddresses(this.selectedWallet)
    },
    5000,
    {
      leading: true
    }
  );

  private getAddresses(wallet):Promise<any>{
    return new Promise((resolve)=>{
      this.am.list(wallet).then(am => {
        // this.logger.debug('---------------------------------addresses')        
        // this.logger.debug(am)      
        this.addrWithBalance = _.filter(am, (a) => {
          return a.amount > 0
        })
        this.selectedAddr = this.addrWithBalance[0]
        // this.logger.debug('-----------------------this.addrWithBalance')
        // this.logger.debug(this.addrWithBalance)
        return resolve()
      })
    })
  }

  public handleSelectWallet(selectedWallet){
    this.logger.debug('------handleSelectWallet')
    this.logger.debug(selectedWallet)
    this.getAddresses(selectedWallet)
  }

  public handleSelectAddress(selectedAddr){
    this.logger.debug('--------handleSelectAddress')
    this.logger.debug(selectedAddr)
  }

  public handleSelectFeeLevel(selectedFee){
    this.logger.debug('--------handleSelectFeeLevel')
    this.logger.debug(selectedFee)
  }

  public handleChangeFromQty(newQty){
    if(newQty && this.fromQty !== newQty){
      this.fromQty = newQty;
      this.toQty = this.rate*newQty;
      this.toQtyEntered = this.toQty;
    }else if(this.fromQty !== newQty){
      this.fromQty = 0;
      this.toQty = 0;
      this.fromQtyEntered = this.fromQty;
      this.toQtyEntered = this.toQty;
    }
  }

  public handleChangeToQty(newQty){
    if(newQty && this.toQty !== newQty){
      this.fromQty = this.toQty/this.rate;
      this.toQty = newQty;
      this.fromQtyEntered = this.fromQty;
    }else if(this.toQty !== newQty){
      this.fromQty = 0;
      this.toQty = 0;
      this.fromQtyEntered = this.fromQty;
      this.toQtyEntered = this.toQty;
    }
  }

  private async updateRate():Promise<any>{
    return new Promise((resolve, reject) => {
      if(this.fromCoin.symbol=='ETH'){
        this.getBuyRates(this.toCoin.id, 1)
          .then((rates) =>{
            this.logger.debug('------')
            this.logger.debug(rates)
            this.rate = 1/rates[0].src_qty;
            return resolve()
          })
          .catch(() => {
            this.logger.debug('Update rate failed!');
            this.rate = 0;
            return reject()
          })
      }else if(this.toCoin.symbol=='ETH'){
        this.getSellRates(this.fromCoin.id, 1)
          .then((rates) => {
            this.rate = rates[0].dst_qty
            return resolve()
          })
          .catch(() => {
            this.logger.debug('Update rate failed!');
            this.rate = 0;
            return reject()
          })
      }
    })    
  }

  /**
   * Source coin select onchange event handler.
   * When the source coin is token, check if it is supported.
   * @param {*} e 
   */
  public handleChangeFromCoin(newToken){
    this.logger.debug('------------fromCoin')
    this.logger.debug(newToken)
    this.logger.debug(this.fromCoin)
    if(this.fromCoin.symbol!==newToken.symbol){
      if(newToken.symbol!=='ETH'){
        this.fromCoin = newToken;
      	this.toCoin = this.tokens[0];
        this.fromTokens=this.tokens
        this.toTokens=[this.tokens[0]]
      	this.ethQty = 0;
      	this.tokenQty = 0;
      }else{
        this.fromCoin = newToken;
        this.toCoin = this.tokens[1];  // use KNC by default
        this.fromTokens=[this.tokens[0]]
        this.toTokens=this.tokens
        this.ethQty = 0;
        this.tokenQty = 0;
      }      
      this.selectedFromCoin = this.fromCoin;
      this.selectedToCoin = this.toCoin;

      // update rate and token amount
      this.updateRate().then(()=>{
        this.toQty = this.rate*this.fromQty;
        this.toQtyEntered = this.toQty;
      })
      .catch(()=>{
        this.fromQty = 0;
        this.toQty = 0;
      })
    }   
  }

  /**
   * Destination coin select onchange event handler.
   * When the destination coin is token, check if it is supported.
   * @param {*} e 
   */
  public handleChangeToCoin(newToken){
    this.logger.debug('-----------toCoin')
    this.logger.debug(newToken)
    this.logger.debug(this.toCoin)
    if(this.toCoin.symbol !== newToken.symbol){
      if(newToken.symbol!=='ETH'){
	      this.toCoin = newToken;
	      this.fromCoin = this.tokens[0];  // use ETH by default
        this.toTokens=this.tokens
        this.fromTokens=[this.tokens[0]]
	      this.ethQty = 0;
	      this.tokenQty = 0;
      }else{
      	this.toCoin = newToken;
        this.fromCoin = this.tokens[1];  // use KNC by default
        this.fromTokens=this.tokens
        this.toTokens=[this.tokens[0]]
        this.ethQty = 0;
        this.tokenQty = 0;
      }
      this.selectedFromCoin = this.fromCoin;
      this.selectedToCoin = this.toCoin;

      // update rate and token amount
      this.updateRate().then(()=>{
        this.fromQty = this.toQty/this.rate;
        this.fromQtyEntered = this.fromQty;
      })
      .catch(()=>{
        this.fromQty = 0;
        this.toQty = 0;
      })
    }
  }

  /**
   * Get all supported tokens on Kyber Network
   */
  private getSupportedTokens() {
    // Querying the API /currencies endpoint
    this.http
      .get(this.apiURL + 'currencies')
      .subscribe(
        (res:any) => {
          this.logger.info('SUCCESS REQUEST:'+this.apiURL + 'currencies');
          this.tokens = res.data;
          this.fromCoin = this.tokens[0]
          this.toCoin = this.tokens[1]
          this.selectedFromCoin = this.fromCoin;
          this.selectedToCoin = this.toCoin;
          // update token list
          this.fromTokens=[this.tokens[0]]
          this.toTokens=this.tokens
          // update rate
          this.updateRate();
          return res;
        },
        () => {
          this.logger.error('ERROR REQUEST:'+this.apiURL + 'currencies');
          return null;
        }
      );
  }

  /**
   * Get the transaction details needed for a user to create and sign a new transaction 
   * to make the conversion between the specified pair.
   * @param {*} user_address the ETH address that will be executing the swap.
   * @param {*} src_id source token id
   * @param {*} dst_id destination asset id
   * @param {*} src_qty the source amount in the conversion 
   * @param {*} min_dst_qty 97% of the amount of assets to buy
   * @param {*} gas_price low/medium/high
   */
  private getTradeDetails(user_address, src_id, dst_id, src_qty, min_dst_qty, gas_price): Promise<any> {
    return new Promise((resolve, reject) => {
      // Querying the API /trade_data endpoint
      const headers = new HttpHeaders({
        'Content-Type': 'application/json; charset=utf-8'
      });
      const urlSearchParams = new HttpParams()
        .set('user_address', user_address)
        .set('src_id', src_id)
        .set('dst_id', dst_id)
        .set('src_qty', src_qty)
        .set('min_dst_qty', min_dst_qty)
        .set('gas_price', gas_price)
        .set('wallet_id', user_address); // the wallet address that is registered for the fee sharing program.
      this.http
        .get(this.apiURL + 'trade_data', {
          params: urlSearchParams,
          headers
        })
        .subscribe(
          (res) => {
            this.logger.info('SUCCESS REQUEST:'+this.apiURL + 'trade_data');
            // this.logger.info(res);
            return resolve(res);
          },
          (err) => {
            this.logger.error('ERROR REQUEST:'+this.apiURL + 'trade_data');
            return reject(err);
          }
        );
    })    
  }

  /**
   * Get tokens enabled statuses of an Ethereum wallet. 
   * It indicates if the wallet can sell a token or not.
   * @param {*} user_address the ETH address to get information from.
   */
  private getEnabledStatuses(user_address):Promise<any> {
    return new Promise((resolve, reject)=>{
      // Querying the API /users/<user_address>/currencies endpoint
      this.http
        .get(this.apiURL + 'users/' + user_address + '/currencies')
        .subscribe(
          (res:any) => {
            this.logger.info('SUCCESS REQUEST:'+ this.apiURL + 'users/' + user_address + '/currencies');
            // this.logger.info(res.data);
            return resolve(res.data);
          },
          (err) => {
            this.logger.error('ERROR REQUEST:'+ this.apiURL + 'users/' + user_address + '/currencies');
            return reject(err);
          }
        );
    })
  }

  /**
   * Check if the token is enabled
   * @param  {[type]}       token [description]
   * @return {Promise<any>}       [description]
   */
  private checkTokenEnabled(token): Promise<any>{
    return new Promise((resolve, reject) => {
      this.getEnabledStatuses(this.selectedAddr.address).then((enabledStatuses)=>{
        // Checking to see if TOKEN is enabled
        let isTokenEnabled =  enabledStatuses && enabledStatuses.some(x => {
          if (x.id.toLowerCase() == token.id.toLowerCase()) {
            return x.enabled
          }
        })

        if(!isTokenEnabled){
          this.getEnableTokenDetails(this.selectedAddr.address, token.id, this.selectedFee).then((enableTokenDetails) => {
            // Extract the raw transaction details
            let rawTx = enableTokenDetails
            this.logger.debug(rawTx)
            // // Create a new transaction
            // let tx = new Tx(rawTx)
            // // Signing the transaction
            // tx.sign(this.PRIVATE_KEY)
            // // Serialise the transaction (RLP encoding)
            // let serializedTx = tx.serialize()
            // // Broadcasting the transaction
            // let txReceipt = await this.web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex')).catch(error => this.logger.debug(error))
            // // Log the transaction receipt
            // this.logger.debug(txReceipt)
            return resolve();
          })
          .catch((err)=>{
            this.logger.debug(err);
            return reject(err);
          })
        }
      })
      .catch((err) => {
        this.logger.debug(err);
        return reject(err);
      })
    })   
  }

  /**
   * Get transaction details needed for a user to create and sign a new transaction 
   * to approve the KyberNetwork contract to spend tokens on the user's behalf.
   * @param {*} user_address 
   * @param {*} id 
   * @param {*} gas_price 
   */
  private getEnableTokenDetails(user_address, id, gas_price):Promise<any> {
    return new Promise((resolve,reject) => {
      // Querying the API /users/<user_address>/currencies/<currency_id>/enable_data?gas_price=<gas_price> endpoint
      const headers = new HttpHeaders({
        'Content-Type': 'application/json; charset=utf-8'
      });
      const urlSearchParams = new HttpParams()
        .set('gas_price', gas_price);
      this.http
        .get(this.apiURL + 'users/' + user_address + '/currencies/' + id + '/enable_data', {
          params: urlSearchParams,
          headers
        })
        .subscribe(
          (res:any) => {
            this.logger.info('SUCCESS REQUEST:'+ this.apiURL + 'users/' + user_address + '/currencies/' + id + '/enable_data');
            // this.logger.info(res.data);
            return resolve(res.data);
          },
          (err) => {
            this.logger.error('ERROR REQUEST:'+ this.apiURL + 'users/' + user_address + '/currencies/' + id + '/enable_data');
            return reject(err);
          }
        );
    })
  }

  /**
   * Get the latest buy rate (in ETH) for the specified token.
   * @param {*} id token id
   * @param {*} qty the amount of units of the token to buy.
   */
  private getBuyRates(id, qty):Promise<any> {
    return new Promise((resolve, reject) =>{
      // Querying the API /buy_rate endpoint
      const headers = new HttpHeaders({
        'Content-Type': 'application/json; charset=utf-8'
      });
      const urlSearchParams = new HttpParams()
        .set('id', id)
        .set('qty', qty);
      this.http
        .get(this.apiURL + 'buy_rate', {
          params: urlSearchParams,
          headers
        })
        .subscribe(
          (res: any) => {
            this.logger.info('SUCCESS REQUEST:'+this.apiURL + 'buy_rate');
            this.logger.info(res);
            return resolve(res.data);
          },
          (err) => {
            this.logger.error('ERROR REQUEST:'+this.apiURL + 'buy_rate');
            return reject(err);
          }
        );
    })    
  }

  /**
   * Get the latest SELL conversion rate in ETH. 
   * @param {*} id id of the token you want to sell using ETH.
   * @param {*} qty the amount of units of the token to sell
   */
  private getSellRates(id, qty):Promise<any> {
    return new Promise((resolve, reject) =>{
      // Querying the API /sell_rate endpoint
      const headers = new HttpHeaders({
        'Content-Type': 'application/json; charset=utf-8'
      });
      const urlSearchParams = new HttpParams()
        .set('id', id)
        .set('qty', qty);
      this.http
        .get(this.apiURL + 'sell_rate', {
          params: urlSearchParams,
          headers
        })
        .subscribe(
          (res:any) => {
            this.logger.info('SUCCESS REQUEST:'+this.apiURL + 'sell_rate');
            return resolve(res.data);
          },
          (err) => {
            this.logger.error('ERROR REQUEST:'+this.apiURL + 'sell_rate');
            return reject(err);
          }
        );
     })
  }

  /**
   * Execute the trade
   * @param {*} tradeDetails 
   */
  private async executeTrade(tradeDetails){
    this.txNotFinished = true;
    this.showResult = false;
    // Extract the raw transaction details
    let rawTx = tradeDetails.data[0];
    this.logger.debug(rawTx);
    // Create a new transaction
    // let tx = new Tx(rawTx);
    // // Signing the transaction
    // tx.sign(this.PRIVATE_KEY);
    // // Serialise the transaction (RLP encoding)
    // let serializedTx = tx.serialize();
    // // Broadcasting the transaction
    // let txReceipt = await this.web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
    //   .catch(error => { 
    //     this.logger.debug(error); 
    //     this.txNotFinished = false;
    //   });
    // Log the transaction receipt
    this.showResult = true;
    // this.txSuccess = txReceipt.status;
    // this.txHash = txReceipt.transactionHash;
    // this.txNotFinished = false;
    // this.logger.debug(txReceipt);
    // return txReceipt;
  }

  public async startSwap() {    
    if(this.fromQty>0 && this.toQty>0){
      let tokenToCheck = this.fromCoin.symbol
      /* if ETH -> TOKEN */
      if (this.fromCoin.symbol == 'ETH' && this.toCoin.symbol !== "ETH") {
        tokenToCheck = this.toCoin.symbol
      }

      // enable token
      this.checkTokenEnabled(tokenToCheck).then(()=>{
        // trade execution
        this.getTradeDetails(this.selectedAddr.address, this.fromCoin.id, this.toCoin.id, this.fromQty, this.toQty * 0.97, this.selectedFee).then((tradeDetails) => {
            this.executeTrade(tradeDetails)
          })
        })
        .catch((err) => {
          this.logger.debug(err)
        })
    }    
  }

}
