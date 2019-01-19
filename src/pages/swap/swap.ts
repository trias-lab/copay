import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Component } from '@angular/core';
// import { NavController, NavParams } from 'ionic-angular';
import { Logger } from '../../providers/logger/logger';

// import ethereumjs-tx to sign and serialise transactions
// import { Tx } from 'ethereumjs-tx';
// Import node-fetch to query the trading API
// const fetch = require('node-fetch');
// Import web3 for broadcasting transactions
// import { Web3 } from 'web3';
/**
 * Generated class for the SwapPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-swap',
  templateUrl: 'swap.html',
})
export class SwapPage {
	public message: string = '';
	public fromCoin;
 	public isFromCoinSupported: boolean = true;
  public toCoin;
  public isToCoinSupported: boolean = true;
  public ethQty: number;
  public tokenQty: number;
  public GAS_PRICE = 'medium';  // Gas price of the transaction
  public USER_ACCOUNT; // Your Ethereum wallet address
  public WALLET_ID;  // Your fee sharing address
  public private_key;
  public showResult = false;
  public txSuccess = false;
  public txHash: string = '';
  public tokens = [];
  public txNotFinished: boolean = false;

  private TOKEN_ADDRESS: string;
  private ETH_TOKEN_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';  // Representation of ETH as an address on Ropsten
  private apiURL: string = 'https://ropsten-api.kyber.network/';
  // private PRIVATE_KEY: object;
  // private web3;

	constructor(
  	// private navCtrl: NavController, 
  	// private navParams: NavParams,
  	private logger: Logger,
    private http: HttpClient
	) {
    this.ethQty = 0;
    this.tokenQty = 0; 
    this.USER_ACCOUNT = '0xE35A45B9D8eb40b17B3c466eB3D8712fdeF23184'; // Your Ethereum wallet address
    this.WALLET_ID = '0xE35A45B9D8eb40b17B3c466eB3D8712fdeF23184';  // Your fee sharing address
    this.private_key = '48b036b995e7f14a5907e6add49d00f6ceb0601de4f3862171930cf64a133db6';
    this.TOKEN_ADDRESS = '0x4E470dc7321E84CA96FcAEDD0C8aBCebbAEB68C6'  // use KNC contract address on Ropsten by default
    this.ETH_TOKEN_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'  // Representation of ETH as an address on Ropsten
    this.apiURL = 'https://ropsten-api.kyber.network/'
    this.getSupportedTokens();
    // Connect to Infura's ropsten node
    // this.web3 = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io"));

    // Your private key
    // this.PRIVATE_KEY = Buffer.from(this.private_key, 'hex');
  }

  async ionViewDidLoad() {
    this.logger.info('ionViewDidLoad SwapPage');
    // this.getSupportedTokens();
    // let tokens = await this.getSupportedTokens()
    // this.tokens = tokens.data;
  }

  /**
   * Token quantity input onchange event handler.
   * Get rates
   * @param {*} e 
   */
  public async handleChangeTokenQty(){
    let qty = this.tokenQty
    this.logger.debug('------------new:', this.tokenQty)
    /* ETH -> TOKEN */
    if(this.tokenQty){
      if(this.fromCoin.symbol == 'ETH' && this.toCoin.symbol !== 'ETH'){
        if (this.isToCoinSupported) {
          /*
          ######################################
          ### GET ETH/TOKEN CONVERSION RATES ###
          ######################################
          */        
          let rates = await this.getBuyRates(this.TOKEN_ADDRESS, qty);
          // Getting the source quantity
          let ethQty = rates[0].src_qty;
          this.tokenQty = qty;
          this.ethQty = ethQty;
        }
        /* TOKEN -> ETH */
      }else{
        if (this.isFromCoinSupported) {
          /*
          ####################################
          ### GET ENABLED STATUS OF WALLET ###
          ####################################
          */
          let isTokenEnabled = this.isTokenEnabled()

          /*
          ####################################
          ### ENABLE WALLET IF NOT ENABLED ###
          ####################################
          */
          if(!isTokenEnabled){
            let enableTokenDetails = this.getEnableTokenDetails(this.USER_ACCOUNT, this.TOKEN_ADDRESS, this.GAS_PRICE)
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
          }

          /*
          ####################################
          ### GET KNC/ETH CONVERSION RATES ###
          ####################################
          */
          let rates = this.getSellRates(this.TOKEN_ADDRESS, qty)
          // Getting the source quantity
          let ethQty = rates[0].dst_qty
          this.tokenQty = qty;
          this.ethQty = ethQty;
        }
      }
    }   
  }

  /**
   * Source coin select onchange event handler.
   * When the source coin is token, check if it is supported.
   * @param {*} e 
   */
  public handleChangeFromCoin(token){
    this.logger.debug('------------fromCoin')
    this.logger.debug(token)
    this.logger.debug(this.fromCoin)
    if(this.fromCoin.symbol!==token.symbol){
      if(token.symbol!=='ETH'){
        /*
        ###################################
        ### CHECK IF TOKEN IS SUPPORTED ###
        ###################################
        */ 
        let isTokenSupported = this.isTokenSupported(token.symbol)
        if (isTokenSupported) {
        	// this.fromCoin = token;
        	this.toCoin = this.tokens[0];
        	this.ethQty = 0;
        	this.tokenQty = 0;
          // set token address
          this.TOKEN_ADDRESS = token.id
        } else {
          this.message = 'Token ' + token.symbol + ' is not supported';
        }
      }else{
        // this.fromCoin = token;
        this.toCoin = this.tokens[1];  // use KNC by default
        this.ethQty = 0;
        this.tokenQty = 0;
        // set token address
        this.TOKEN_ADDRESS = "0x4E470dc7321E84CA96FcAEDD0C8aBCebbAEB68C6"
      }
    }   
  }

  /**
   * Destination coin select onchange event handler.
   * When the destination coin is token, check if it is supported.
   * @param {*} e 
   */
  public handleChangeToCoin(token){
    this.logger.debug('-----------toCoin')
    this.logger.debug(token)
    this.logger.debug(this.toCoin)
    if(this.toCoin.symbol !== token.symbol){
      if(token.symbol!=='ETH'){
        /*
        ###################################
        ### CHECK IF TOKEN IS SUPPORTED ###
        ###################################
        */ 
        let isTokenSupported = this.isTokenSupported(token.symbol)
        if (isTokenSupported) {
  	      // this.toCoin = token;
  	      this.fromCoin = this.tokens[0];  // use ETH by default
  	      this.ethQty = 0;
  	      this.tokenQty = 0;
          this.TOKEN_ADDRESS = token.id
        } else {
          this.message = 'Token ' + token.symbol + ' is not supported';
        }
      }else{
      	// this.toCoin = token;
        this.fromCoin = this.tokens[1];  // use KNC by default
        this.ethQty = 0;
        this.tokenQty = 0;
        this.TOKEN_ADDRESS = "0x4E470dc7321E84CA96FcAEDD0C8aBCebbAEB68C6"
      }
    }
  }

  /**
   * Private key onchange event handler
   * @param {*} e 
   */
  // public handleChangePrivateKey(e){
  //   this.private_key = e.target.value;
  //   // this.PRIVATE_KEY = Buffer.from(e.target.value, 'hex');
  // }

  /**
   * User wallet address onchange event handler
   * @param {*} e 
   */
  // public handleChangeUserAccount(e){
  //   // set wallet_id and user_account to the same address by default
  //   this.USER_ACCOUNT = e.target.value;
  //   this.WALLET_ID = e.target.value;
  // }

  /**
   * Get all supported tokens on Kyber Network
   */
  private getSupportedTokens() {
    // this.logger.debug('---getSupportedTokens')
    // Querying the API /currencies endpoint
    // let tokensBasicInfoRequest = await fetch(this.apiURL + 'currencies')
    this.http
      .get(this.apiURL + 'currencies')
      .subscribe(
        (res:any) => {
          this.logger.info('SUCCESS REQUEST:'+this.apiURL + 'currencies');
          // this.logger.info(res);
          this.tokens = res.data;
          this.fromCoin = this.tokens[0]
          this.toCoin = this.tokens[1]
          return res;
        },
        () => {
          this.logger.error('ERROR REQUEST:'+this.apiURL + 'currencies');
          return null;
        }
      );
    // Parsing the output
    // let tokensBasicInfo = await tokensBasicInfoRequest.json()
    // this.logger.debug('---all tokens')
    // this.logger.debug(tokensBasicInfo)
    // return tokensBasicInfoRequest
  }

  /**
   * Check if a token is supported on Kyber Network
   * @param {*} tokenStr symbol of the token
   */
  private isTokenSupported(tokenStr){
    // let self = this
    // let tokens = this.getSupportedTokens();
    // Checking to see if token is supported
    return this.tokens.some(token => {
      if(tokenStr == token.symbol){
        this.TOKEN_ADDRESS = token.address
        return true
      }else{
      	return false
      }
    });
  }

  /**
   * Get the latest buy rate (in ETH) for the specified token.
   * @param {*} id token id
   * @param {*} qty the amount of units of the token to buy.
   */
  private getBuyRates(id, qty):Promise<any> {
    return new Promise((resolve, reject) =>{
      // Querying the API /buy_rate endpoint
      // let ratesRequest = await fetch(this.apiURL + 'buy_rate?id=' + id + '&qty=' + qty)
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
      // Parsing the output
      // let rates = await ratesRequest.json()
      // this.logger.debug('rates:')
      // this.logger.debug(rates)
      // return rates
    })    
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
   * @param {*} wallet_id the wallet address that is registered for the fee sharing program.
   */
  private getTradeDetails(user_address, src_id, dst_id, src_qty, min_dst_qty, gas_price, wallet_id) {
    // Querying the API /trade_data endpoint
    // let tradeDetailsRequest = await fetch(this.apiURL + 'trade_data?user_address=' + user_address + '&src_id=' + src_id + '&dst_id=' + dst_id + '&src_qty=' + src_qty + '&min_dst_qty=' + min_dst_qty + '&gas_price=' + gas_price + '&wallet_id=' + wallet_id)
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
      .set('wallet_id', wallet_id);
    this.http
      .get(this.apiURL + 'trade_data', {
        params: urlSearchParams,
        headers
      })
      .subscribe(
        (res) => {
          this.logger.info('SUCCESS REQUEST:'+this.apiURL + 'trade_data');
          // this.logger.info(res);
          return res;
        },
        () => {
          this.logger.error('ERROR REQUEST:'+this.apiURL + 'trade_data');
          return null;
        }
      );
    // Parsing the output
    // let tradeDetails = await tradeDetailsRequest.json()
    // this.logger.debug('tradeDetails:')
    // this.logger.debug(tradeDetails)
    // return tradeDetails
  }

  /**
   * Get tokens enabled statuses of an Ethereum wallet. 
   * It indicates if the wallet can sell a token or not.
   * @param {*} user_address the ETH address to get information from.
   */
  private getEnabledStatuses(user_address):any {
    // Querying the API /users/<user_address>/currencies endpoint
    // let enabledStatusesRequest = await fetch(this.apiURL + 'users/' + user_address + '/currencies')
    this.http
      .get(this.apiURL + 'users/' + user_address + '/currencies')
      .subscribe(
        (res:any) => {
          this.logger.info('SUCCESS REQUEST:'+ this.apiURL + 'users/' + user_address + '/currencies');
          // this.logger.info(res.data);
          return res.data;
        },
        () => {
          this.logger.error('ERROR REQUEST:'+ this.apiURL + 'users/' + user_address + '/currencies');
          return null;
        }
      );
    // Parsing the output
    // let enabledStatuses = await enabledStatusesRequest.json()
    // this.logger.debug('enabledStatuses:')
    // this.logger.debug(enabledStatuses)
    // return enabledStatuses
  }

  /**
   * Check if the token is enabled
   */
  private isTokenEnabled(){
    let enabledStatuses = this.getEnabledStatuses(this.USER_ACCOUNT)
    // Checking to see if TOKEN is enabled
    return enabledStatuses && enabledStatuses.some(token => {
      if (token.id.toLowerCase() == this.TOKEN_ADDRESS.toLowerCase()) {
        return token.enabled
      }
    })
  }

  /**
   * Get transaction details needed for a user to create and sign a new transaction 
   * to approve the KyberNetwork contract to spend tokens on the user's behalf.
   * @param {*} user_address 
   * @param {*} id 
   * @param {*} gas_price 
   */
  private getEnableTokenDetails(user_address, id, gas_price) {
    // Querying the API /users/<user_address>/currencies/<currency_id>/enable_data?gas_price=<gas_price> endpoint
    // let enableTokenDetailsRequest = await fetch(this.apiURL + 'users/' + user_address + '/currencies/' + id + '/enable_data?gas_price=' + gas_price)
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
          return res.data;
        },
        () => {
          this.logger.error('ERROR REQUEST:'+ this.apiURL + 'users/' + user_address + '/currencies/' + id + '/enable_data');
          return null;
        }
      );
    // Parsing the output
    // let enableTokenDetails = await enableTokenDetailsRequest.json()
    // this.logger.debug('enableTokenDetails:')
    // this.logger.debug(enableTokenDetails)
    // return enableTokenDetails
  }

  /**
   * Get the latest SELL conversion rate in ETH. 
   * @param {*} id id of the token you want to sell using ETH.
   * @param {*} qty the amount of units of the token to sell
   */
  private getSellRates(id, qty):any {
    // Querying the API /sell_rate endpoint
    // let ratesRequest = await fetch(this.apiURL + 'sell_rate?id=' + id + '&qty=' + qty)
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
          // this.logger.info(res.data);
          return res.data;
        },
        () => {
          this.logger.error('ERROR REQUEST:'+this.apiURL + 'sell_rate');
          return null;
        }
      );
    // Parsing the output
    // let rates = await ratesRequest.json()
    // return rates
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

    
    if(this.ethQty>0 && this.tokenQty>0){
      /* ETH -> TOKEN */
      if (this.fromCoin.symbol == 'ETH' && this.toCoin.symbol !== "ETH") {
        /*
        #######################
        ### TRADE EXECUTION ###
        #######################
        */
        let tradeDetails = await this.getTradeDetails(this.USER_ACCOUNT, this.ETH_TOKEN_ADDRESS, this.TOKEN_ADDRESS, this.ethQty, this.tokenQty * 0.97, this.GAS_PRICE, this.WALLET_ID);
        this.executeTrade(tradeDetails)

        /* TOKEN -> ETH */
      } else if (this.fromCoin.symbol !== 'ETH' && this.toCoin.symbol == "ETH") {
        /*
        #######################
        ### TRADE EXECUTION ###
        #######################
        */
        let tradeDetails = await this.getTradeDetails(this.USER_ACCOUNT, this.TOKEN_ADDRESS, this.ETH_TOKEN_ADDRESS, this.tokenQty, this.ethQty * 0.97, this.GAS_PRICE, this.WALLET_ID);
        this.executeTrade(tradeDetails);
      }
    }    
  }

}
