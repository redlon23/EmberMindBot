const request = require('request-promise');
const ApiAccess = require("./ApiAccess");
const {sortParamsAlphabetically} = require("./util");

class BybitAccess extends ApiAccess {
    constructor() {
        super()
        this.base = "https://api-testnet.bybit.com"
        this.public = 'kkbceTwJmL51V3Gdg2';
        this.secret = 'O6dVZ8PbDT3KAFNNk5OHMTee2XIWReLfgOKN';
    }

    async getSymbolPriceTicker(symbol){
        const endPoint = "/v2/public/tickers"
        const params = sortParamsAlphabetically({symbol})

        const url = `${this.base}${endPoint}?${params}`
        const requestOptions = {
            url,
            method: "GET"
        };

        let data = await request(requestOptions)
        return JSON.parse(data)
    }
}

async function testHere(){
    const by = new BybitAccess();
    let data = await by.getSymbolPriceTicker("BTCUSDT");
    console.log(data)
}

testHere()