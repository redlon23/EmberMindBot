const request = require('request-promise');
const ApiAccess = require("./ApiAccess");
const {sortParamsAlphabetically} = require("./util");

class BybitAccess extends ApiAccess {
    constructor(pblic, secret) {
        super(pblic, secret);
        this.base = "https://api-testnet.bybit.com";
        // this.public = 'kkbceTwJmL51V3Gdg2';
        // this.secret = 'O6dVZ8PbDT3KAFNNk5OHMTee2XIWReLfgOKN';
    }

    setApiKeys(pblic, secret){
        this.public = pblic;
        this.secret = secret
    }

    async getOrderBook(symbol) {
        const endPoint = "/v2/public/orderBook/L2";
        const params = sortParamsAlphabetically({ symbol });

        let url = `${this.base}${endPoint}?${params}`;
        const requestOptions = {
            url,
            method: "GET"
        };

        let data = await request(requestOptions);
        return JSON.parse(data)
    }

    async getSymbolPriceTicker(symbol){
        const endPoint = "/v2/public/tickers";
        const params = sortParamsAlphabetically({symbol});

        const url = `${this.base}${endPoint}?${params}`;
        const requestOptions = {
            url,
            method: "GET"
        };

        let data = await request(requestOptions);
        return JSON.parse(data)
    }

        async getPositions(symbol){
        const endPoint = "/private/linear/position/list";
        const params = sortParamsAlphabetically({ symbol, api_key: this.public ,timestamp: Date.now() });
        const sign = this._getSignature(params);
        const url = `${this.base}${endPoint}?${params}&sign=${sign}`;
        const requestOptions = {
            url,
            method: "GET"
        };

        let data = await request(requestOptions);
        return JSON.parse(data)
    }

    async placeLimitOrder(symbol, side, qty, price, time_in_force = '', reduce_only = '', close_on_trigger = ''){
        const endPoint = "/private/linear/order/create";
        const params = sortParamsAlphabetically({ symbol, side, qty, price, time_in_force, order_type: "Limit", reduce_only, api_key: this.public, close_on_trigger ,timestamp: Date.now() });
        const sign = this._getSignature(params);
        const url = `${this.base}${endPoint}?${params}&sign=${sign}`;
        const requestOptions = {
            url,
            method: "POST"
        };

        let data = await request(requestOptions);
        return JSON.parse(data)
    }
    

    async placeMarketOrder(symbol, side, qty, time_in_force = '', reduce_only = '', close_on_trigger = ''){
        const endPoint = "/private/linear/order/create";
        const params = sortParamsAlphabetically({ symbol, side, qty, time_in_force, order_type: "Market", reduce_only, api_key: this.public, close_on_trigger ,timestamp: Date.now() });
        const sign = this._getSignature(params);
        const url = `${this.base}${endPoint}?${params}&sign=${sign}`;
        const requestOptions = {
            url,
            method: "POST"
        };

        let data = await request(requestOptions);
        return JSON.parse(data)
    }

    async cancelSingleOrder(symbol, order_id = '', order_link_id=''){
        const endPoint = "/private/linear/order/cancel";
        const params = sortParamsAlphabetically({ symbol, order_id, order_link_id, api_key: this.public ,timestamp: Date.now() });
        const sign = this._getSignature(params);
        const url = `${this.base}${endPoint}?${params}&sign=${sign}`;
        const requestOptions = {
            url,
            method: "POST"
        };

        let data = await request(requestOptions);
        return JSON.parse(data)
    }

    async cancelAllOrders(symbol){
        const endPoint = "/private/linear/order/cancel-all";
        const params = sortParamsAlphabetically({ symbol, api_key: this.public ,timestamp: Date.now() });
        const sign = this._getSignature(params);
        const url = `${this.base}${endPoint}?${params}&sign=${sign}`;
        const requestOptions = {
            url,
            method: "POST"
        };

        let data = await request(requestOptions);
        return JSON.parse(data)
    }

    async placeConditionalLimitOrder(symbol, side, qty, price, base_price, stop_px, trigger_by = '', time_in_force = '', reduce_only = '', close_on_trigger = ''){
        const endPoint = "/private/linear/stop-order/create";
        const params = sortParamsAlphabetically({ symbol, side, qty, price, base_price, stop_px, trigger_by, time_in_force, order_type: "Limit", reduce_only, api_key: this.public, close_on_trigger ,timestamp: Date.now() });
        const sign = this._getSignature(params);
        const url = `${this.base}${endPoint}?${params}&sign=${sign}`;
        const requestOptions = {
            url,
            method: "POST"
        };

        let data = await request(requestOptions);
        return JSON.parse(data)
    }

    async placeConditionalMarketOrder(symbol, side, qty, base_price, stop_px, trigger_by = '', time_in_force = '', reduce_only = '', close_on_trigger = ''){
        const endPoint = "/private/linear/stop-order/create";
        const params = sortParamsAlphabetically({ symbol, side, qty, base_price, stop_px, trigger_by, time_in_force, order_type: "Market", reduce_only, api_key: this.public, close_on_trigger ,timestamp: Date.now() });
        const sign = this._getSignature(params);
        const url = `${this.base}${endPoint}?${params}&sign=${sign}`;
        const requestOptions = {
            url,
            method: "POST"
        };

        let data = await request(requestOptions);
        return JSON.parse(data)
    }

    async cancelSingleConditionalOrder(symbol, stop_order_id = '', order_link_id=''){
        const endPoint = "/private/linear/stop-order/cancel";
        const params = sortParamsAlphabetically({ symbol, stop_order_id, order_link_id, api_key: this.public ,timestamp: Date.now() });
        const sign = this._getSignature(params);
        const url = `${this.base}${endPoint}?${params}&sign=${sign}`;
        const requestOptions = {
            url,
            method: "POST"
        };

        let data = await request(requestOptions);
        return JSON.parse(data)
    }

    async cancelAllConditionalOrders(symbol){
        const endPoint = "/private/linear/stop-order/cancel-all";
        const params = sortParamsAlphabetically({ symbol, api_key: this.public ,timestamp: Date.now() });
        const sign = this._getSignature(params);
        const url = `${this.base}${endPoint}?${params}&sign=${sign}`;
        const requestOptions = {
            url,
            method: "POST"
        };

        let data = await request(requestOptions);
        return JSON.parse(data)
    }

    async getKlineData(symbol, interval, from, limit=''){
        const endPoint = "/public/linear/kline";
        const params = sortParamsAlphabetically({symbol, interval, from, limit});

        const url = `${this.base}${endPoint}?${params}`;
        const requestOptions = {
            url,
            method: "GET"
        };

        let data = await request(requestOptions);
        return JSON.parse(data)
    }

    async getWalletData(coin) {
        const endPoint = '/v2/private/wallet/balance'
        const params = sortParamsAlphabetically({coin, api_key: this.public, timestamp: Date.now()});
        const sign = this._getSignature(params);

        const url = `${this.base}${endPoint}?${params}&sign=${sign}`;
        const requestOptions = {
            url,
            method: "GET"
        };

        let data = await request(requestOptions);
        return JSON.parse(data)
    }

    async getWalletRecords() {
        const endPoint = '/open-api/wallet/fund/records'
        const params = sortParamsAlphabetically({wallet_fund_type: 'RealisedPNL', api_key: this.public, timestamp: Date.now()});
        const sign = this._getSignature(params);

        const url = `${this.base}${endPoint}?${params}&sign=${sign}`;
        const requestOptions = {
            url,
            method: "GET"
        };

        let data = await request(requestOptions);
        return JSON.parse(data)
    }

    async getTradeRecords(symbol, start_time = '', end_time = '') {
        const endPoint = '/private/linear/trade/closed-pnl/list'
        const params = sortParamsAlphabetically({symbol, start_time, end_time, api_key: this.public, timestamp: Date.now()});
        const sign = this._getSignature(params);

        const url = `${this.base}${endPoint}?${params}&sign=${sign}`;
        const requestOptions = {
            url,
            method: "GET"
        };

        let data = await request(requestOptions);
        return JSON.parse(data)
    }

}
module.exports = BybitAccess;

async function testHere(){
    const by = new BybitAccess();
    // let data = await by.cancelSingleOrder("BTCUSDT", "24234234")
    let data = await by.getWalletData("USDT");
    // let data = await by.getTradeRecords("BTCUSDT", (Date.now() - 1000 * 60 * 60 * 24) / 1000 | 0)
    // let data = await by.placeLimitOrder("BTCUSDT", "Buy", 0.1, 9000, "GoodTillCancel", false, 1);
    // let data = await by.cancelSingleOrder("BTCUSDT", '', 1)
    // let data = await by.cancelAllOrders("BTCUSDT")
    // console.log(data.result.data);
    // console.log(data.result.data.length);

    console.log(data)
}

testHere();