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
        return await this.access.getKlineData(symbol, "1d", nDaysAgo, 200)
    }

    async get1HourPeriodKline(symbol, period){
        let periodBack = Math.floor(Date.now() - (1000 * 60 * 60 * period));
        return await this.access.getKlineData(symbol, "1h", periodBack, period)
    }

    async get15MinutePeriodKline(symbol, period){
        let periodBack = Math.floor(Date.now() - (1000 * 60 * 15 * period));
        return await this.access.getKlineData(symbol, "15m", periodBack, period)
    }

    async get200DayMovingAverage(symbol){
        let total = 0.0;
        let data = await this.get200DayKline(symbol);
        for(let i = 0; i < data.length; i++){
            total += Number.parseFloat(data[i][4]);
        }
        return (total / data.length).toFixed(2);
    }

    calculateSmaRsi(periodData){
        let upMove = 0.0;
        let downMove = 0.0;
        let len = periodData.length;
        for(let i = 1; i < len; i++){
            let change = periodData[i][4] - periodData[i - 1][4];
            if (change > 0){
                upMove += change;
            }
            if(change < 0){
                downMove += Math.abs(change);
            }
        }
        let rsi = 100 - 100 / (1 + (upMove/ len) / (downMove / len))
        console.log(rsi)
    }

    calculateSmoothedRsi(periodData=[], period){
        let averageGain = 0.0;
        let averageLoss = 0.0;
        let [prevAverageGain, prevAverageLoss] = this._firstAvgGainLoss(periodData.slice(0, period));
        for(let i = period; i < periodData.length; i++){
            let currentGain = 0.0;
            let currentLoss = 0.0;
            let change = periodData[i][4] - periodData[i - 1][4];
            if(change > 0){
                currentGain = change;
            } else {
                currentLoss = Math.abs(change);
            }
            averageGain = ((prevAverageGain * (period - 1)) + currentGain) / period ;
            averageLoss = ((prevAverageLoss * (period - 1)) + currentLoss) / period

            prevAverageLoss = averageLoss;
            prevAverageGain = averageGain;
        }

        let rs = averageGain / averageLoss;
        return 100 - (100 / (1 + rs));
    }

    _firstAvgGainLoss(periodData){
        let upMove = 0.0;
        let downMove = 0.0;
        for(let i = 1; i < periodData.length; i++){
            let change = periodData[i][4] - periodData[i - 1][4];
            if (change > 0){
                upMove += change;
            }
            if(change < 0){
                downMove += Math.abs(change);
            }
        }
        return [upMove/periodData.length, downMove/periodData.length];
    }

    calculateSma(periodData){
        let total = 0.0;
        for(let i =0; i < periodData.length; i++){
            total += Number.parseFloat(periodData[i][4]);
        }
        return Number.parseFloat((total / periodData.length).toFixed(2))
    }

    calculateBollingerBands(periodData =[], period){
        let total = 0.0;
        let mid = this.calculateSma(periodData);
        for(let i = 0; i < periodData.length; i++){
            let price = Number.parseFloat(periodData[i][4]);
            total += Math.pow(price - mid, 2);
        }
        let std = Math.sqrt(total * (1/period))
        let upper = mid + (std * 2);
        let lower = mid - (std * 2);
        return [mid, upper, lower];
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
        let res = await this.access.getKlineData(symbol,"D", nDaysAgo / 1000 | 0);
        return res.result;
    }

    async get1HourPeriodKline(symbol, period){
        let periodBack = Math.floor(Date.now() - (1000 * 60 * 60 * period));
        let res = await this.access.getKlineData(symbol, 60, periodBack / 1000 | 0);
        return res.result;
    }

    async get15MinutePeriodKline(symbol, period){
        let periodBack = Math.floor(Date.now() - (1000 * 60 * 15 * period));
        let res = await this.access.getKlineData(symbol, 15, periodBack / 1000 | 0);
        return res.result;
    }

    async get200DayMovingAverage(symbol) {
        let data = await this.get200DayKline(symbol);
        let sum = 0;
        for(const obj of data.result) {
            sum += obj.close;
        }
        return sum/data.result.length;
    }

    calculateRSI(periodData) {
        let up = 0;
        let down = 0;
        let len = periodData.length - 1;
        for(let i = 0; i < len; i++) {
            let change = periodData[i].close - periodData[i + 1].close;
            if(change > 0) {
                up += change;
            } else {
                down += Math.abs(change);
            }
        }

        return 100 - 100 / (1 + (up/len)/(down/len));
    }
    
    calculateSmoothedRsi(periodData=[], period){
        let averageGain = 0.0;
        let averageLoss = 0.0;
        let [prevAverageGain, prevAverageLoss] = this._firstAvgGainLoss(periodData.slice(0, period));
        for(let i = period; i < periodData.length; i++){
            let currentGain = 0.0;
            let currentLoss = 0.0;
            let change = periodData[i].close - periodData[i - 1].close;
            if(change > 0){
                currentGain = change;
            } else {
                currentLoss = Math.abs(change);
            }
            averageGain = ((prevAverageGain * (period - 1)) + currentGain) / period;
            averageLoss = ((prevAverageLoss * (period - 1)) + currentLoss) / period;

            prevAverageLoss = averageLoss;
            prevAverageGain = averageGain;
        }

        let rs = averageGain / averageLoss;
        return 100 - (100 / (1 + rs));

    }

    _firstAvgGainLoss(periodData){
        let upMove = 0.0;
        let downMove = 0.0;
        for(let i = 1; i < periodData.length; i++){
            let change = periodData[i][4] - periodData[i - 1][4];
            if (change > 0){
                upMove += change;
            }
            if(change < 0){
                downMove += Math.abs(change);
            }
        }
        return [upMove/periodData.length, downMove/periodData.length];
    }

    calculateSma(periodData){
        let total = 0.0;
        for(let i =0; i < periodData.length; i++){
            total += Number.parseFloat(periodData[i].close);
        }
        return total / periodData.length
    }

    calculateBollingerBands(periodData){
        let sma = this.calculateSma(periodData);
        let prices = []
        for(let price of periodData) {
            prices.push(price.close)
        }

        let sd = Math.sqrt(prices.map(x => Math.pow(x-sma, 2)).reduce((a, b) => a +b ) / periodData.length);

        return {upper: sma + 2*sd, mean: sma, lower: sma - 2*sd};
    }

}

let bin = new Binance();

let by = new Bybit();

async function main(){
    let res = await bin.get15MinutePeriodKline("BTCUSDT", 20);
    console.log(bin.calculateBollingerBands(res, 20));
    // let rsi = by.calculateRSI(res)
    // console.log(res)
}

main()