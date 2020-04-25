const request = require('request-promise');
const ApiAccess = require("./ApiAccess");
const {sortParamsAlphabetically} = require("./util");

class BybitAccess extends ApiAccess {
    constructor() {
        super();
        this.base = "https://api-testnet.bybit.com";
        this.public = 'kkbceTwJmL51V3Gdg2';
        this.secret = 'O6dVZ8PbDT3KAFNNk5OHMTee2XIWReLfgOKN';
    }

    async getOrderBook(symbol, limit = '') {
        const endPoint = "/public/linear/recent-trading-records";
        const params = sortParamsAlphabetically({ symbol, limit });

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
}

async function testHere(){
    const by = new BybitAccess();
    let data = await by.placeLimitOrder("BTCUSDT", "Buy", 1, 7400, "GoodTillCancel", "false", "false" );
    console.log(data)
}

testHere();