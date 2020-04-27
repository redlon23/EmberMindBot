const BinanceAccess = require("./BinanceAccess");
const BybitAccess = require("./BybitAccess");

class Binance{
    constructor() {
        this.access = new BinanceAccess();
    }

    async highestBidLowestAsk(symbol){
        let data = await this.access.getOrderBook(symbol, 5);
        let highestBid = data.bids[0][0];
        let lowestAsk = data.asks[0][0];
        return {highestBid, lowestAsk}
    }

    async getSymbolPrice(symbol){
        let data = await this.access.getSymbolPriceTicker(symbol);
        return data.price;
    }

    async getPosition(symbol){
        let data = await this.access.getPositions();
        return data.find(position => position.symbol === symbol)
    }

    async get200DayKline(symbol){
        let nDays = 200
        let nDaysAgo = Math.floor(Date.now() - (1000 * 60 * 60 * 24 * nDays));
        return await this.access.getKlineData(symbol, "1d", nDaysAgo / 1000 | 0, 200)
    }

    async get1HourPeriodKline(symbol, period){
        let periodBack = Math.floor(Date.now() - (1000 * 60 * 60 * period));
        return await this.access.getKlineData(symbol, "1h", periodBack / 1000 | 0, period)
    }

    async get15MinutePeriodKline(symbol, period){
        let periodBack = Math.floor(Date.now() - (1000 * 60 * period));
        return await this.access.getKlineData(symbol, "15m", periodBack / 1000 | 0, period)
    }
}

class Bybit{
    constructor() {
        this.access = new BybitAccess();
    }
    async highestBidLowestAsk(symbol){
        let data = await this.access.getOrderBook(symbol);
        let highestBid = data.result[0];
        let lowestAsk = data.result[data.result.length/2]
        return {highestBid, lowestAsk}
    }

    async getSymbolPrice(symbol){
        let data = await this.access.getSymbolPriceTicker(symbol);
        return data.result[0].last_price;
    }

    async getPosition(symbol){
        let data = await this.access.getPositions(symbol);
        return data.result.find(position => position.size !== 0)
    }

    async get200DayKline(symbol){
        let nDays = 200;
        let nDaysAgo = Math.floor(Date.now() - (1000 * 60 * 60 * 24 * nDays));
        return await this.access.getKlineData(symbol,"D", nDaysAgo / 1000 | 0);
    }

    async get1HourPeriodKline(symbol, period){
        let periodBack = Math.floor(Date.now() - (1000 * 60 * 60 * period));
        return await this.access.getKlineData(symbol, 60, periodBack / 1000 | 0);
    }

    async get15MinutePeriodKline(symbol, period){
        let periodBack = Math.floor(Date.now() - (1000 * 60 * period));
        return await this.access.getKlineData(symbol, 15, periodBack / 1000 | 0);
    }

    async get200DayMovingAverage(symbol) {
        let data = await this.get200DayKline(symbol);
        let sum = 0;

        for(const obj of data.result) {
            sum += obj.close;
        }

        return sum/data.result.length;
    }
}

let bin = new Binance();

let by = new Bybit();

async function main(){
    let res = await by.get200DayMovingAverage("BTCUSDT");
    // console.log(res)
    // let res = await by.get1HourKline("BTCUSDT", 12);
    console.log(res)
}

main()