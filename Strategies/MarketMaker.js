const {Bybit, Binance} = require("../Apis/Common");

class MarketMaker{
    constructor(ApiAccess, settings) {
        this.access = new ApiAccess();
        this.state = ''
        this.openPosition = false;
        this.settings = {rsiKlinePeriod: "15m", symbol: "BTCUSDT",
            quantity: 0.01, stopLoss: 30, takeProfit: 20,
            rsiOverBought: 70, rsiOverSold: 35};
        this.ma200 = 0.0;
        this.rsiValue = 0.0;
        this.entryPrice = 0.0;
    }

    async handleState(){
        this.ma200 = await this.access.get200DayMovingAverage(this.settings.symbol);
        let currentPrice = await this.access.getSymbolPrice(this.settings.symbol);
        this._decideState(this.ma200, currentPrice);
    }

    async handleTrade(){
        let trade = await this.checkRsi();
        if(trade){
            let res = await this.placeInitialOrder();
        }
    }

    async checkPosition(){
        let [positionAmount, positionEntryPrice] = await this.access.checkPosition(this.settings.symbol);
        if(positionAmount > 0){
            this.openPosition = true
            this.entryPrice = positionEntryPrice;
        }


    }

    async handlePosition(){
        let price = await this.access.getSymbolPrice(this.settings.symbol)
        let isReversal = await this.handleReversal(price)
        if(!isReversal){
           if(!await this.checkTakeProfit(price)){
               await this.checkStopLoss(price);
           }
        }
    }

    async checkTakeProfit(price){
        if(this.state === "Bearish"){ // SHORT POSITION
            if(price + this.settings.takeProfit <= this.entryPrice){
                await this.access.placeMarketReduceOrder(this.settings.symbol, "BUY", this.settings.quantity)
                this.openPosition = false;
                return true;
            }
        } else if (this.state === "Bullish"){ // LONG POSITION
            if(price - this.settings.takeProfit >= this.entryPrice){
                await this.access.placeMarketReduceOrder(this.settings.symbol, "SELL", this.settings.quantity)
                this.openPosition = false;
                return true;
            }
        }
    }

    async checkStopLoss(price){
        if(this.state === "Bearish"){ // SHORT POSITION
            if(price - this.settings.stopLoss >= this.entryPrice){
                await this.access.placeMarketReduceOrder(this.settings.symbol, "BUY", this.settings.quantity)
                this.openPosition = false;
                return true;
            }
        } else if (this.state === "Bullish"){ // LONG POSITION
            if(price + this.settings.stopLoss <= this.entryPrice){
                await this.access.placeMarketReduceOrder(this.settings.symbol, "SELL", this.settings.quantity)
                this.openPosition = false;
                return true;
            }
        }
    }


    async handleReversal(price){
        if(this.state === "Bearish"){ // SHORT POSITION
            if(price > this.ma200 && this.rsiValue > this.settings.rsiOverBought){
                await this.access.placeMarketReduceOrder(this.settings.symbol, "BUY", this.settings.quantity)
                this.state = "Bullish";
                // Reversal
                await this.placeInitialOrder()
                return true;
            }
        } else if (this.state === "Bullish"){ // LONG POSITION
            if(price < this.ma200 && this.rsiValue < this.settings.rsiOverSold){
                await this.access.placeMarketReduceOrder(this.settings.symbol, "SELL", this.settings.quantity)
                this.state = "Bearish";
                // Reversal
                await this.placeInitialOrder()
                return true;
            }
        }
        return false
    }

    async placeInitialOrder(){
        let {highestBid, lowestAsk} = this.access.highestBidLowestAsk(this.settings.symbol);
        if(this.state === "Bearish"){
            this.orderId = await this.access.placeLimitOrder(this.settings.symbol, "SELL",
                this.settings.quantity, lowestAsk, "GTC")

        } else if (this.state === "Bullish"){
            this.orderId = await this.access.placeLimitOrder(this.settings.symbol, "BUY",
                this.settings.quantity, highestBid, "GTC")
        }
    }


    async checkRsi(){
        let rsiTimeSeries = null;
        if(this.settings.rsiKlinePeriod === "15m"){
            rsiTimeSeries = await this.access.get15MinutePeriodKline(
                this.settings.symbol, 200
            )
        } else {
            rsiTimeSeries = await this.access.get1HourPeriodKline(
                this.settings.symbol, 200
            )
        }
        this.rsiValue = this.access.calculateSmoothedRsi(rsiTimeSeries, 14);
        return this._isTrade(this.rsiValue);
    }

    _isTrade(rsi){
        if(this.state === "Bearish" && rsi >= this.settings.rsiOverBought){
            return true;
        } else if(this.state === "Bullish" && rsi <= this.settings.rsiOverSold){
            return true;
        }
        return false;
    }


    _decideState(ma200, currentPrice){
        if(ma200 > currentPrice){
            this.state = "Bearish"
        } else {
            this.state = "Bullish"
        }
    }

    async tradeLoop(){
        await this.checkPosition();
        if(this.openPosition){

        } else{
            let ready = await this.checkRsi();
            if(ready){
                await this.placeInitialOrder();
            }
        }
    }

}

async function main(){
    let mm = new MarketMaker(Binance, {})
    await mm.handleState();
}

main()