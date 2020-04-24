const crypto = require("crypto")
const request = require('request-promise');

function KeyValue(key, value) {
    this.key = key;
    this.value = value;
}

KeyValue.prototype = {
    toString: function () {
        return encodeURIComponent(this.key) + '=' + encodeURIComponent(this.value);
    }
};

function sortParamsAlphabetically(requestParams) {
    var query = [];
    for (var key in requestParams) {
        if (requestParams.hasOwnProperty(key)) {
            query.push(new KeyValue(key, requestParams[key]));
        }
    }
    query.sort(function (a, b) {
        return a.key < b.key ? -1 : 1
    });
    return query.join('&');
}

class BinanceFuturesAccess {
    constructor() {
        this.base = "https://testnet.binancefuture.com"
        this.public = '9e0562c79dbc44344ba26738c70c8ca47bc493ea8f250911cd7b30e9106ef9ab';
        this.secret = 'cedf05c2d33e3c03344c8220f6aa7aed9538db9d7895da488310a3b8ab609c49';
    }

    _getSignature(requestParams) {
        return crypto.createHmac('sha256', this.secret).update(requestParams, "utf-8").digest('hex')
    }

    async getAccountInformation(recvWindow = '') {
        const endPoint = "/fapi/v1/account"
        const params = sortParamsAlphabetically({recvWindow, timestamp: Date.now()})
        const signature = this._getSignature(params)

        let url = `${this.base}${endPoint}?${params}&signature=${signature}`;
        const requestOptions = {
            headers: {'X-MBX-APIKEY': this.public},
            url,
            method: "GET"
        };

        let data = await request(requestOptions)
        return JSON.parse(data)
    }

    async getAccountBalance(recvWindow = '') {
        const endPoint = "/fapi/v1/balance"
        const params = sortParamsAlphabetically({recvWindow, timestamp: Date.now()})
        const signature = this._getSignature(params)

        let url = `${this.base}${endPoint}?${params}&signature=${signature}`;
        const requestOptions = {
            headers: {'X-MBX-APIKEY': this.public},
            url,
            method: "GET"
        };

        let data = await request(requestOptions)
        return JSON.parse(data)
    }

    async getOrderBook(symbol, limit = '') {
        const endPoint = "/fapi/v1/depth"
        const params = sortParamsAlphabetically({symbol, limit});

        let url = `${this.base}${endPoint}?${params}`;
        const requestOptions = {
            url,
            method: "GET"
        };

        let data = await request(requestOptions)
        return JSON.parse(data)
    }

    async getSymbolPriceTicker(symbol = '') {
        const endPoint = "/fapi/v1/ticker/price"
        const params = sortParamsAlphabetically({symbol})

        let url = `${this.base}${endPoint}?${params}`;
        const requestOptions = {
            url,
            method: "GET"
        };

        let data = await request(requestOptions)
        return JSON.parse(data)
    }

    async getIncomeHistory(symbol = '', incomeType = '', startTime = '', endTime = '', limit = '', recvWindow = ''){
        const endPoint = "/fapi/v1/income";
        const params = sortParamsAlphabetically({symbol, incomeType, startTime, endTime, limit, recvWindow, timestamp: Date.now()});
        const signature = this._getSignature(params)

        let url = `${this.base}${endPoint}?${params}&signature=${signature}`;
        const requestOptions = {
            headers: {'X-MBX-APIKEY': this.public},
            url,
            method: "GET"
        }

        let data = await request(requestOptions);
        return JSON.parse(data);    
    }

    async changeLeverage(symbol, leverage, recvWindow = ''){
        const endPoint = "/fapi/v1/leverage";
        const params = sortParamsAlphabetically({symbol, leverage, recvWindow, timestamp: Date.now()});
        const signature = this._getSignature(params)

        let url = `${this.base}${endPoint}?${params}&signature=${signature}`;
        const requestOptions = {
            headers: {'X-MBX-APIKEY': this.public},
            url,
            method: "POST"
        }

        let data = await request(requestOptions);
        return JSON.parse(data);   
    }

    async getOpenOrders(symbol = '', recvWindow = ''){
        const endPoint = '/fapi/v1/openOrders'
        const params = sortParamsAlphabetically({symbol, recvWindow, timestamp: Date.now()});
        const signature = this._getSignature(params)

        let url = `${this.base}${endPoint}?${params}&signature=${signature}`;
        const requestOptions = {
            headers: {'X-MBX-APIKEY': this.public},
            url,
            method: "GET"
        }

        let data = await request(requestOptions);
        return JSON.parse(data);  
    }

    async cancelAllOpenOrders(symbol, recvWindow = ''){
        const endPoint = '/fapi/v1/allOpenOrders';
        const params = sortParamsAlphabetically({symbol, recvWindow, timestamp: Date.now()})
        const signature = this._getSignature(params);

        let url = `${this.base}${endPoint}?${params}&signature=${signature}`;
        const requestOptions = {
            headers: {'X-MBX-APIKEY': this.public},
            url,
            method: "DELETE"
        }

        let data = await request(requestOptions);
        return JSON.parse(data);   
    }

}


async function testHere() {
    let bin = new BinanceFuturesAccess()
    let awa = await bin.getSymbolPriceTicker("BTCUSDT").catch(err => console.log(err.message))
    console.log(awa)
}


testHere()