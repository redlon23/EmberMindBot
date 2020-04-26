const request = require('request-promise');
const ApiAccess = require("./ApiAccess");
const {sortParamsAlphabetically} = require("./util");

class BinanceFuturesAccess extends ApiAccess {
    constructor() {
        super();
        this.base = "https://testnet.binancefuture.com"
        this.public = '9e0562c79dbc44344ba26738c70c8ca47bc493ea8f250911cd7b30e9106ef9ab';
        this.secret = 'cedf05c2d33e3c03344c8220f6aa7aed9538db9d7895da488310a3b8ab609c49';
    }

    async getAccountInformation() {
        const endPoint = "/fapi/v1/account";
        const params = sortParamsAlphabetically({timestamp: Date.now()});
        const signature = this._getSignature(params);

        let url = `${this.base}${endPoint}?${params}&signature=${signature}`;
        const requestOptions = {
            headers: { 'X-MBX-APIKEY': this.public },
            url,
            method: "GET"
        };

        let data = await request(requestOptions);
        return JSON.parse(data)
    }

    async getAccountBalance() {
        const endPoint = "/fapi/v1/balance";
        const params = sortParamsAlphabetically({timestamp: Date.now()});
        const signature = this._getSignature(params);

        let url = `${this.base}${endPoint}?${params}&signature=${signature}`;
        const requestOptions = {
            headers: { 'X-MBX-APIKEY': this.public },
            url,
            method: "GET"
        };

        let data = await request(requestOptions);
        return JSON.parse(data)
    }

    async getOrderBook(symbol, limit = '') {
        const endPoint = "/fapi/v1/depth";
        const params = sortParamsAlphabetically({ symbol, limit });

        let url = `${this.base}${endPoint}?${params}`;
        const requestOptions = {
            url,
            method: "GET"
        };

        let data = await request(requestOptions);
        return JSON.parse(data)
    }

    async getSymbolPriceTicker(symbol = '') {
        const endPoint = "/fapi/v1/ticker/price";
        const params = sortParamsAlphabetically({ symbol });

        let url = `${this.base}${endPoint}?${params}`;
        const requestOptions = {
            url,
            method: "GET"
        };

        let data = await request(requestOptions);
        return JSON.parse(data)
    }

    async getIncomeHistory(symbol = '', incomeType = '', startTime = '', endTime = '', limit = '', recvWindow = '') {
        const endPoint = "/fapi/v1/income";
        const params = sortParamsAlphabetically({ symbol, incomeType, startTime, endTime, limit, recvWindow, timestamp: Date.now() });
        const signature = this._getSignature(params);

        let url = `${this.base}${endPoint}?${params}&signature=${signature}`;
        const requestOptions = {
            headers: { 'X-MBX-APIKEY': this.public },
            url,
            method: "GET"
        };

        let data = await request(requestOptions);
        return JSON.parse(data);
    }

    async changeLeverage(symbol, leverage, recvWindow = '') {
        const endPoint = "/fapi/v1/leverage";
        const params = sortParamsAlphabetically({ symbol, leverage, recvWindow, timestamp: Date.now() });
        const signature = this._getSignature(params);

        let url = `${this.base}${endPoint}?${params}&signature=${signature}`;
        const requestOptions = {
            headers: { 'X-MBX-APIKEY': this.public },
            url,
            method: "POST"
        };

        let data = await request(requestOptions);
        return JSON.parse(data);
    }

    async getOpenOrders(symbol = '', recvWindow = '') {
        const endPoint = '/fapi/v1/openOrders';
        const params = sortParamsAlphabetically({ symbol, recvWindow, timestamp: Date.now() });
        const signature = this._getSignature(params);

        let url = `${this.base}${endPoint}?${params}&signature=${signature}`;
        const requestOptions = {
            headers: { 'X-MBX-APIKEY': this.public },
            url,
            method: "GET"
        };

        let data = await request(requestOptions);
        return JSON.parse(data);
    }

    async cancelAllOrders(symbol) {
        const endPoint = '/fapi/v1/allOpenOrders';
        const params = sortParamsAlphabetically({ symbol, timestamp: Date.now() });
        const signature = this._getSignature(params);

        let url = `${this.base}${endPoint}?${params}&signature=${signature}`;
        const requestOptions = {
            headers: { 'X-MBX-APIKEY': this.public },
            url,
            method: "DELETE"
        };

        let data = await request(requestOptions);
        return JSON.parse(data);
    }

    async cancelSingleOrder(symbol, orderId = '', origClientOrderId = '') {
        const endPoint = '/fapi/v1/order';
        const params = sortParamsAlphabetically({ symbol, orderId, origClientOrderId, timestamp: Date.now() });
        const signature = this._getSignature(params);

        let url = `${this.base}${endPoint}?${params}&signature=${signature}`;
        const requestOptions = {
            headers: { 'X-MBX-APIKEY': this.public },
            url,
            method: "DELETE"
        };

        let data = await request(requestOptions);
        return JSON.parse(data);
    }

    async cancelMultipleOrders(symbol = '', orderIdList = '', origClientOrderIdList = '') {
        const endPoint = '/fapi/v1/batchOrders';
        const params = sortParamsAlphabetically({ symbol, orderIdList, origClientOrderIdList, timestamp: Date.now() });
        const signature = this._getSignature(params);

        let url = `${this.base}${endPoint}?${params}&signature=${signature}`;
        const requestOptions = {
            headers: { 'X-MBX-APIKEY': this.public },
            url,
            method: "DELETE"
        };

        let data = await request(requestOptions);
        return JSON.parse(data);
    }

    async placeMarketOrder(symbol, side, quantity, reduceOnly = '', positionSide = '', newClientOrderId = '', activationPrice = '', callbackRate = '', workingType = '', newOrderRespType = '') {
        const endPoint = '/fapi/v1/order';
        const params = sortParamsAlphabetically({
            symbol, side, type: 'MARKET', reduceOnly, quantity, positionSide,
            newClientOrderId, activationPrice, callbackRate, workingType, newOrderRespType,
            timestamp: Date.now()
        });
        const signature = this._getSignature(params);

        let url = `${this.base}${endPoint}?${params}&signature=${signature}`;
        const requestOptions = {
            headers: { 'X-MBX-APIKEY': this.public },
            url,
            method: "POST"
        };

        let data = await request(requestOptions);
        return JSON.parse(data);
    }
    
    async placeLimitOrder(symbol, side, quantity, price, timeInForce, positionSide = '', reduceOnly = ''){
        const endPoint = "/fapi/v1/order";
        const params = sortParamsAlphabetically({symbol, side, positionSide, timeInForce, quantity, reduceOnly, price, type: "LIMIT", timestamp: Date.now()})
        const signature = this._getSignature(params);

        let url = `${this.base}${endPoint}?${params}&signature=${signature}`;
        const requestOptions = {
            headers: {'X-MBX-APIKEY': this.public},
            url,
            method: "POST"
        };

        let data = await request(requestOptions);
        return JSON.parse(data);   
    }

    async placeStopMarketOrder(symbol, side, quantity, stopPrice, positionSide = '', newClientOrderId = '', activationPrice = '', callbackRate = '', workingType = '', newOrderRespType = '') {
        const endPoint = '/fapi/v1/order';
        const params = sortParamsAlphabetically({
            symbol, side, type: 'STOP_MARKET', stopPrice, reduceOnly: 'true', quantity, positionSide,
            newClientOrderId, activationPrice, callbackRate, workingType, newOrderRespType,
            timestamp: Date.now()
        });
        const signature = this._getSignature(params);

        let url = `${this.base}${endPoint}?${params}&signature=${signature}`;
        const requestOptions = {
            headers: { 'X-MBX-APIKEY': this.public },
            url,
            method: "POST"
        };

        let data = await request(requestOptions);
        return JSON.parse(data);
    }

    async placeTakeProfitMarketOrder(symbol, side, quantity, stopPrice, positionSide = '', newClientOrderId = '', activationPrice = '', callbackRate = '', workingType = '', newOrderRespType = '') {
        const endPoint = '/fapi/v1/order';
        const params = sortParamsAlphabetically({
            symbol, side, type: 'TAKE_PROFIT_MARKET', stopPrice, reduceOnly: 'true', quantity, positionSide,
            newClientOrderId, activationPrice, callbackRate, workingType, newOrderRespType,
            timestamp: Date.now()
        });
        const signature = this._getSignature(params);

        let url = `${this.base}${endPoint}?${params}&signature=${signature}`;
        const requestOptions = {
            headers: { 'X-MBX-APIKEY': this.public },
            url,
            method: "POST"
        };

        let data = await request(requestOptions);
        return JSON.parse(data);
    }

    async placeStopOrder(symbol, side, quantity, price, stopPrice){
        const endPoint = "/fapi/v1/order";
        const params = sortParamsAlphabetically({symbol, side, quantity, reduceOnly:"true", price, stopPrice, type: "STOP", timestamp: Date.now()})
        const signature = this._getSignature(params);
    
        let url = `${this.base}${endPoint}?${params}&signature=${signature}`;
        const requestOptions = {
            headers: {'X-MBX-APIKEY': this.public},
            url,
            method: "POST"
        };
    
        let data = await request(requestOptions);
        return JSON.parse(data);   
    }

    async placeTakeProfitOrder(symbol, side, quantity, price, stopPrice){
        const endPoint = "/fapi/v1/order";
        const params = sortParamsAlphabetically({symbol, side, quantity, reduceOnly:"true", price, stopPrice, type: "TAKE_PROFIT", timestamp: Date.now()})
        const signature = this._getSignature(params);
    
        let url = `${this.base}${endPoint}?${params}&signature=${signature}`;
        const requestOptions = {
            headers: {'X-MBX-APIKEY': this.public},
            url,
            method: "POST"
        };
    
        let data = await request(requestOptions);
        return JSON.parse(data);   
    }

    async placeTrailingStopMarket(symbol, side, quantity, callbackRate){
        const endPoint = "/fapi/v1/order";
        const params = sortParamsAlphabetically({symbol, side, quantity, callbackRate, reduceOnly:"true", type: "TRAILING_STOP_MARKET", timestamp: Date.now()})
        const signature = this._getSignature(params);
    
        let url = `${this.base}${endPoint}?${params}&signature=${signature}`;
        const requestOptions = {
            headers: {'X-MBX-APIKEY': this.public},
            url,
            method: "POST"
        };
    
        let data = await request(requestOptions);
        return JSON.parse(data);  
    }

    async getPositions(){
        const endPoint = "/fapi/v1/positionRisk";
        const params = sortParamsAlphabetically({timestamp: Date.now()});
        const signature = this._getSignature(params);

        let url = `${this.base}${endPoint}?${params}&signature=${signature}`;
        const requestOptions = {
            headers: {'X-MBX-APIKEY': this.public},
            url,
            method: "GET"
        };

        let data = await request(requestOptions);
        return JSON.parse(data);
    }
}


async function testHere() {
    let bin = new BinanceFuturesAccess();
    let awa = await bin.getPositions().catch(err => console.log(err.message))
    console.log(awa)
}


testHere();
