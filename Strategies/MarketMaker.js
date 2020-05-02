const {Bybit, Binance} = require("../Apis/Common");

class MarketMaker{
    constructor(ApiAccess, settings) {
        this.access = new ApiAccess();
        this.state = ''
        this.openPosition = false;
        this.settings = {rsiKlinePeriod: "15m", symbol: "BTCUSDT",
            quantity: 0.01, stopLoss: 30, takeProfit: 5,
            rsiOverBought: 70, rsiOverSold: 35};
        this.ma200 = 0.0;
        this.rsiValue = 0.0;
        this.entryPrice = 0.0;
        this.orderId = null;
    }

    async handleState(){
        let currentPrice = await this.access.getSymbolPrice(this.settings.symbol);
        this._decideState(this.ma200, currentPrice);
    }

    async handleTrade(){
        let isTradeReady = await this.checkRsi();
        if(isTradeReady){
            if(this.orderId !== null){
                await this.access.cancelSingleOrder(this.settings.symbol, this.orderId)
                this.orderId = null;
            }
            await this.placeInitialOrder(); // Internally saves orderId.
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
        await this.checkRsi()
        let price = await this.access.getSymbolPrice(this.settings.symbol)
        let isReversal = await this.handleReversal(price)
        if(!isReversal){
            let res = await this.checkTakeProfit(price)
           if(!res){
               await this.checkStopLoss(price);
           }
        }
    }

    async checkTakeProfit(price){ // Change this to limit order
        console.log(`Price: ${price},\n Entry price: ${this.entryPrice}`)
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
        console.log(`Price: ${price},\n Entry price: ${this.entryPrice}`)
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
            console.log(price > this.ma200 && this.rsiValue > this.settings.rsiOverBought)
            if(price > this.ma200 && this.rsiValue > this.settings.rsiOverBought){
                await this.access.placeMarketReduceOrder(this.settings.symbol, "BUY", this.settings.quantity)
                this.state = "Bullish";
                // Reversal
                console.log("reversal")
                await this.placeInitialOrder() // // Internally saves orderId.
                return true;
            }
        } else if (this.state === "Bullish"){ // LONG POSITION
            console.log(price, this.ma200, this.rsiValue, this.settings.rsiOverBought)
            if(price < this.ma200 && this.rsiValue < this.settings.rsiOverSold){
                await this.access.placeMarketReduceOrder(this.settings.symbol, "SELL", this.settings.quantity)
                this.state = "Bearish";
                // Reversal
                console.log("reversal")
                await this.placeInitialOrder() // Internally saves orderId.
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
        await this.checkPosition(); // Internally updates openPosition.
        if(this.openPosition){
            this.orderId = null;
            await this.handlePosition(); // Calculates Rsi.
        } else{
            await this.handleState()
            await this.handleTrade() // Internally saves orderId. Calculates Rsi
        //    Wait for next loop - End of loop.
        }
    }

}

async function main(){
    let mm = new MarketMaker(Binance, {})
    mm.ma200 = await mm.access.get200DayMovingAverage(mm.settings.symbol);
    await mm.handleState();
    await mm.tradeLoop()

}

main()