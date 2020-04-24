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
        let sortedParams = sortParamsAlphabetically(requestParams);
        return crypto.createHmac('sha256', this.secret).update(sortedParams, "utf-8").digest('hex')
    }

    async getAccountInformation(recvWindow = '') {
        const endPoint = "/fapi/v1/account"
        const params = {timestamp: Date.now(), recvWindow: recvWindow}
        const signature = this._getSignature(params)

        let url = `${this.base}${endPoint}?${sortParamsAlphabetically(params)}&signature=${signature}`;
        const requestOptions = {
            headers: {'X-MBX-APIKEY': this.public},
            url,
            method: "GET",
        };

        let data = await request(requestOptions)
        return JSON.parse(data)
    }

    async getOrderBook(symbol, limit = '') {
        const endPoint = "/fapi/v1/depth"
        const params = {symbol: symbol, limit: limit}

        let url = `${this.base}${endPoint}?${sortParamsAlphabetically(params)}`;
        const requestOptions = {
            url,
            method: "GET",
        };

        let data = await request(requestOptions)
        return JSON.parse(data)
    }

    async getSymbolPriceTicker(symbol = '') {
        const endPoint = "/fapi/v1/ticker/price"
        const params = {symbol: symbol}

        let url = `${this.base}${endPoint}?${sortParamsAlphabetically(params)}`;
        const requestOptions = {
            url,
            method: "GET",
        };

        let data = await request(requestOptions)
        return JSON.parse(data)
    }


}


async function testHere() {
    let bin = new BinanceFuturesAccess()
    let awa = await bin.getSymbolPriceTicker('BNBUSDT')
    console.log(awa)
}


testHere()