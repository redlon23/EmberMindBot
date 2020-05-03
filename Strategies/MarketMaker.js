const {Bybit, Binance} = require("../Apis/Common");

class MarketMaker{
    constructor(ApiAccess, settings) {
        this.access = new ApiAccess();
        this.state = ''
        this.openPosition = false;
        this.settings = {rsiKlinePeriod: "1m", symbol: "BTCUSDT",
            quantity: 0.01, stopLoss: 100, takeProfit: 1,
            rsiOverBought: 51, rsiOverSold: 49};
        this.ma200 = 0.0;
        this.rsiValue = 0.0;
        this.entryPrice = 0.0;
        this.orderId = null;
    }

    async handleState(){
        this.ma200 = await this.access.getNMinuteMovingAverage(this.settings.symbol, 200);
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
        let [positionAmount, positionEntryPrice, side] = await this.access.checkPosition(this.settings.symbol);
        if(positionAmount > 0){
            this.openPosition = true
            this.entryPrice = positionEntryPrice;
            if(side.toLowerCase() === "buy"){
                this.state = "Bullish";
            }else if(side.toLowerCase() === "sell"){
                this.state = "Bearish";
            }
            console.log(`Open Position with entry price: ${positionEntryPrice}, side: ${side}`);
            return;
        }
        console.log("There is no open position")
    }

    async handlePosition(){
        await this.checkRsi()
        let price = await this.access.getSymbolPrice(this.settings.symbol)
        let isReversal = await this.handleReversal(price)
        if(!isReversal){
            console.log("No Reversal event, checking tp and sl...")
            let res = await this.checkTakeProfit(price)
           if(!res){
               await this.checkStopLoss(price);
           }
        }
    }

    async checkTakeProfit(price){ // Change this to limit order
        if(this.state === "Bearish"){ // SHORT POSITION
            if(price + this.settings.takeProfit <= this.entryPrice){
                await this.access.placeMarketReduceOrder(this.settings.symbol, "Buy", this.settings.quantity)
                this.openPosition = false;
                console.log(`Take profit hit for short position\nCurrent Price: ${price}\nEntry Price: ${this.entryPrice}`)
                return true;
            }
        } else if (this.state === "Bullish"){ // LONG POSITION
            if(price - this.settings.takeProfit >= this.entryPrice){
                await this.access.placeMarketReduceOrder(this.settings.symbol, "Sell", this.settings.quantity)
                this.openPosition = false;
                console.log(`Take profit hit for long position\nCurrent Price: ${price}\nEntry Price: ${this.entryPrice}`)
                return true;
            }
        }
    }

    async checkStopLoss(price){
        if(this.state === "Bearish"){ // SHORT POSITION
            if(price >= this.entryPrice + this.settings.stopLoss){
                await this.access.placeMarketReduceOrder(this.settings.symbol, "Buy", this.settings.quantity)
                this.openPosition = false;
                console.log(`Stop loss hit for short position\nCurrent Price: ${price}\nEntry Price: ${this.entryPrice}`)
                return true;
            }
        } else if (this.state === "Bullish"){ // LONG POSITION
            if(price <= this.entryPrice - this.settings.stopLoss){
                await this.access.placeMarketReduceOrder(this.settings.symbol, "Sell", this.settings.quantity)
                this.openPosition = false;
                console.log(`Stop loss hit for long position\nCurrent Price: ${price}\nEntry Price: ${this.entryPrice}`)
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
                console.log("reversal")
                await this.placeInitialOrder() // // Internally saves orderId.
                return true;
            }
        } else if (this.state === "Bullish"){ // LONG POSITION
            if(price < this.ma200 && this.rsiValue < this.settings.rsiOverSold){
                await this.access.placeMarketReduceOrder(this.settings.symbol, "Sell", this.settings.quantity)
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
        let {highestBid, lowestAsk} = await this.access.highestBidLowestAsk(this.settings.symbol);
        if(this.state === "Bearish"){
            this.orderId = await this.access.placeLimitOrder(this.settings.symbol, "Sell",
                this.settings.quantity, lowestAsk) // For binance GTC

        } else if (this.state === "Bullish"){
            this.orderId = await this.access.placeLimitOrder(this.settings.symbol, "Buy",
                this.settings.quantity, highestBid) // For binance GTC
        }
    }


    async checkRsi(){
        let rsiTimeSeries = null;
        if(this.settings.rsiKlinePeriod === "15m"){
            rsiTimeSeries = await this.access.get15MinutePeriodKline(
                this.settings.symbol, 200
            )
        } else if(this.settings.rsiKlinePeriod === "1m"){
            rsiTimeSeries = await this.access.get1MinutePeriodKline(
                this.settings.symbol, 200
            )
        } else {
            rsiTimeSeries = await this.access.get1HourPeriodKline(
                this.settings.symbol, 200
            )
        }
        this.rsiValue = this.access.calculateSmoothedRsi(rsiTimeSeries, 14);
        console.log("Rsi is: ", this.rsiValue);
        return this._isTrade(this.rsiValue);
    }

    _isTrade(rsi){
        if(this.state === "Bearish" && rsi >= this.settings.rsiOverBought){
            console.log("Trade Zone Bearish!")
            return true;
        } else if(this.state === "Bullish" && rsi <= this.settings.rsiOverSold){
            console.log("Trade Zone Bullish")
            return true;
        }
        console.log("Not in trade zone")
        return false;
    }


    _decideState(ma200, currentPrice){
        if(ma200 > currentPrice){
            this.state = "Bearish"
        } else {
            this.state = "Bullish"
        }
        console.log(
        `
        =====Deciding State =====\n
             Moving Average: ${ma200}\n
             Current Price: ${currentPrice}\n
             Current State: ${this.state}
        =========================
        `
        )
    }

    async tradeLoop(){
        await this.checkPosition(); // Internally updates openPosition.
        if(this.openPosition){
            this.orderId = null;
            await this.handlePosition(); // Calculates Rsi.
        } else{
            await this.handleState()
            await this.handleTrade() // Internally saves orderId. Calculates Rsi
        //    Wait for next loop - End of loop
        }
        console.log("Waiting for the next loop...\n\n")
    }

}

async function main(){
    let mm = new MarketMaker(Bybit, {})
    setInterval(async()=>{
        await mm.tradeLoop()
    }, 10000)

// Todo: there is a case where it places an order but then exits the trade zone.
//   that order stays on the account.

//    Todo: Market making continues as long as we are in trade zone.
//    TODO: if state goes opposite way, open position should be closed.
}

main()