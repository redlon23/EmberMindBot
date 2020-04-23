const crypto = require("crypto")
const request = require('request-promise');

class BinanceFuturesAccess{
    constructor(){
        this.base = "https://testnet.binancefuture.com"
        this.public = '9e0562c79dbc44344ba26738c70c8ca47bc493ea8f250911cd7b30e9106ef9ab';
        this.secret = 'cedf05c2d33e3c03344c8220f6aa7aed9538db9d7895da488310a3b8ab609c49';
    }

    async getAccountInformation(){
        const endPoint = "/fapi/v1/account"
        const timestamp = Date.now();
        let timestampString = `timestamp=${timestamp}`
        const signature = crypto.createHmac('sha256', this.secret).update(timestampString).digest('hex')
        let headers = {
            'X-Requested-With': 'XMLHttpRequest',
            'X-MBX-APIKEY': this.public
        };

        let url = `${this.base}${endPoint}?timestamp=${timestamp}&signature=${signature}`;
        const requestOptions = {
            headers: headers,
            url,
            method: "GET",
        };

        let data = await request(requestOptions)
        return JSON.parse(data)
    }

    async getOrderBook(symbol){
        const endPoint = "/fapi/v1/depth"
        const symbolString = `symbol=${symbol}`

        let url = `${this.base}${endPoint}?${symbolString}`;
        const requestOptions = {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
            },
            url,
            method: "GET",
        };

        let data = await request(requestOptions)
        return JSON.parse(data)
    }

    async getSymbolPriceTicker(symbol){
        const endPoint = "/fapi/v1/ticker/price"
        const symbolString = `symbol=${symbol}`

        let url = `${this.base}${endPoint}?${symbolString}`;
        const requestOptions = {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
            },
            url,
            method: "GET",
        };

        let data = await request(requestOptions)
        return JSON.parse(data)
    }


}
async function testHere(){
    let bin = new BinanceFuturesAccess()
    let awa = await bin.getSymbolPriceTicker('BTCUSDT')
    console.log(awa)
}


testHere()