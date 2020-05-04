const BinanceAccess = require("./BinanceAccess");
const BybitAccess = require("./BybitAccess");

class Binance {
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
        return parseFloat(data.price);
    }

    async getPosition(symbol){
        let data = await this.access.getPositions();
        return data.find(position => position.symbol === symbol)
    }

    async checkPosition(symbol){
        let res = await this.getPosition(symbol);
        let side = null;
        if (res.positionAmt < 0){
            side = "SELL"
        } else if (res.positionAmt > 0){
            side = "BUY"
        }
        return [res.positionAmt, res.entryPrice, side] ;
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

    async get1MinutePeriodKline(symbol, period){
        let periodBack = Math.floor(Date.now() - (1000 * 60 * period));
        return await this.access.getKlineData(symbol, "1m", periodBack, period)
    }

    async getNMinuteMovingAverage(symbol, nMinuteBack){
        let total = 0.0;
        let data = await this.get1MinutePeriodKline(symbol, nMinuteBack);
        for(let i = 0; i < data.length; i++){
            total += Number.parseFloat(data[i][4]);
        }
        let temp = (total / data.length).toFixed(2);
        return Number.parseFloat(temp);
    }

    async get200DayMovingAverage(symbol){
        let total = 0.0;
        let data = await this.get200DayKline(symbol);
        for(let i = 0; i < data.length; i++){
            total += Number.parseFloat(data[i][4]);
        }
        let temp = (total / data.length).toFixed(2);
        return Number.parseFloat(temp);
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
        return 100 - 100 / (1 + (upMove/ len) / (downMove / len))
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
        let rsi =  (100 - (100 / (1 + rs))).toFixed(2);
        return Number.parseFloat(rsi);
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

    async placeLimitOrder(symbol, side, quantity, price, timeInForce){
        try{
            let { orderId } = await this.access.placeLimitOrder(symbol, side,quantity, price, timeInForce)
            return orderId
        } catch (e) {
            return null;
        }
    }

    async placeMarketReduceOrder(symbol, side, quantity){
        return await this.access.placeMarketOrder(symbol, side, quantity, "true")
    }

    async cancelSingleOrder(symbol, orderId){
        let { status } = await this.access.cancelSingleOrder(symbol, orderId)
        return status
    }

}
class Bybit{
    constructor() {
        this.access = new BybitAccess();
    }
    async highestBidLowestAsk(symbol){
        let data = await this.access.getOrderBook(symbol);
        let highestBid = data.result[0].price;
        let lowestAsk = data.result[data.result.length/2].price;
        return {highestBid, lowestAsk};
    }

    async getSymbolPrice(symbol){
        let data = await this.access.getSymbolPriceTicker(symbol);
        return data.result[0].last_price;
    }

    async getPosition(symbol){
        let data = await this.access.getPositions(symbol);
        return data.result.find(position => position.size !== 0);
    }

    async checkPosition(symbol){
        let data = await this.getPosition(symbol);
        return !data ? [0, 0] : [data.size, data.entry_price, data.side];
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

    async get1MinutePeriodKline(symbol, period){
        let periodBack = Math.floor(Date.now() - (1000 * 60 * period));
        let res = await this.access.getKlineData(symbol, 1, periodBack / 1000 | 0);
        return res.result;
    }

    async getNMinuteMovingAverage(symbol, nMinuteBack){
        let data = await this.get1MinutePeriodKline(symbol, nMinuteBack);
        let sum = 0;
        for(const obj of data) {
            sum += obj.close;
        }
        return sum/data.length;
    }

    async get200DayMovingAverage(symbol) {
        let data = await this.get200DayKline(symbol);
        let sum = 0;
        for(const obj of data) {
            sum += obj.close;
        }
        return sum/data.length;
    }

    calculateSmaRsi(periodData) {
        let up = 0.0;
        let down = 0.0;
        let len = periodData.length;
        for(let i = 1; i < len; i++) {
            let change = periodData[i].close - periodData[i - 1].close;
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
        return total / periodData.length;
    }

    calculateBollingerBands(periodData){
        let sma = this.calculateSma(periodData);
        let prices = []
        for(let price of periodData) {
            prices.push(price.close)
        }

        let sd = Math.sqrt(prices.map(x => Math.pow(x-sma, 2)).reduce((a, b) => a +b ) / periodData.length);
        let upper = sma + 2*sd;
        let lower = sma - 2*sd;
        return [sma, upper, lower];
    }

    async getRealizedPnlDay(){
        let data = await this.access.getWalletRecords();
        return data.result;
    }

    async getRealizedPnlTotal(coin){
        let data = await this.access.getWalletData(coin);
        return data.result[coin].cum_realised_pnl;
    }

    async getUnrealizedPnl(coin){
        let data = await this.access.getWalletData(coin);
        return data.result[coin].unrealised_pnl;
    }

    async placeLimitOrder(symbol, side, quantity, price, timeinforce){
        //TODO: Remove GoodTillCancel hardcode when enums are added
        let data = await this.access.placeLimitOrder(symbol, side, quantity, price, "GoodTillCancel");
        return data.result.order_id;
    }

    async placeMarketReduceOrder(symbol, side, quantity, timeinforce){
        //TODO: Remove GoodTillCancel hardcode when enums are added
        let data = await this.access.placeMarketOrder(symbol, side, quantity, "GoodTillCancel", true);
        return data.result;
    }

    async getDualPnlDay(symbol) {
        //1 day back
        let data = await this.access.getTradeRecords(symbol, (Date.now() - 1000 * 60 * 60 * 24) / 1000 | 0);
        let pnl = {gain: 0, loss: 0};
        for(let record of data.result.data) {
            let val = record.closed_pnl;
            if (val > 0) {
                pnl.gain += val;
            } else {
                pnl.loss += val;
            }
        }
        return pnl;
    }

    async cancelSingleOrder(symbol, order_id) {
        let data = await this.access.cancelSingleOrder(symbol, order_id);
        return data.result;
    }

}

module.exports = {
    Bybit,
    Binance
}

let bin = new Binance();

let by = new Bybit();

async function main(){
    let res = await by.highestBidLowestAsk("BTCUSDT")
    console.log(res);
    // console.log(res)
}

// main()

module.exports = {
    Bybit,
    Binance

}