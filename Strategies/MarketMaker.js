const {Bybit, Binance} = require("../Apis/Common");

class MarketMaker{
    constructor(ApiAccess, settings) {
        this.access = new ApiAccess();
        this.state = ''
        this.openPosition = false;
        this.settings = {rsiKlinePeriod: "1m", symbol: "BTCUSDT",
            quantity: 0.01, stopLoss: 100, takeProfit: 200,
            rsiOverBought: 51, rsiOverSold: 49};
        this.ma200 = 0.0;
        this.rsiValue = 0.0;
        this.entryPrice = 0.0;
        this.initOrderId = null;
        this.mmOrderID = null;
        this.positionAmount = 0.0;
    }

    async handleState(){
        this.ma200 = await this.access.getNMinuteMovingAverage(this.settings.symbol, 200);
        let currentPrice = await this.access.getSymbolPrice(this.settings.symbol);
        this._decideState(this.ma200, currentPrice);
    }

    async handleTrade(){
        let isTradeReady = await this.checkRsi();
        if(isTradeReady){
            if(this.initOrderId !== null){
                await this.access.cancelSingleOrder(this.settings.symbol, this.initOrderId)
                this.initOrderId = null;
            }
            await this.placeInitialOrder(); // Internally saves orderId.
        } else if (this.initOrderId !== null){ // If  there is a case where it places an order but then exits the trade zone. FIX
            await this.access.cancelSingleOrder(this.settings.symbol, this.initOrderId)
            this.initOrderId = null;
        }
    }

    async checkPosition(){
        let [positionAmount, positionEntryPrice, side] = await this.access.checkPosition(this.settings.symbol);
        if(positionAmount > this.positionAmount){
            this.mmOrderID = null;
            this.positionAmount = positionAmount
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
        console.log("There is no open position || No Position Change")
    }

    async handlePosition(){
        await this.checkRsi()
        let price = await this.access.getSymbolPrice(this.settings.symbol)
        let isReversal = await this.handleReversal(price) // Internally places reversal orders.
        if(!isReversal){
            console.log("No Reversal event, checking tp and sl...")
            let res = await this.checkTakeProfit(price)
           if(!res){
               await this.checkStopLoss(price);
           }
        }
    }

    async checkTakeProfit(price){ // Todo: Change this to limit order
        if(this.state === "Bearish"){ // SHORT POSITION
            console.log(typeof price, typeof this.settings.takeProfit, typeof this.entryPrice);
            if(price + this.settings.takeProfit <= this.entryPrice){
                await this.access.placeMarketReduceOrder(this.settings.symbol, this.access.ENUM.LONG, this.positionAmount)
                this.openPosition = false;
                console.log(`Take profit hit for short position\nCurrent Price: ${price}\nEntry Price: ${this.entryPrice}\nPosition Size: ${this.positionAmount}`)
                return true;
            }
        } else if (this.state === "Bullish"){ // LONG POSITION
            if(price - this.settings.takeProfit >= this.entryPrice){
                await this.access.placeMarketReduceOrder(this.settings.symbol, this.access.ENUM.SHORT, this.positionAmount)
                this.openPosition = false;
                console.log(`Take profit hit for long position\nCurrent Price: ${price}\nEntry Price: ${this.entryPrice}\nPosition Size: ${this.positionAmount}`)
                return true;
            }
        }
    }

    async checkStopLoss(price){
        if(this.state === "Bearish"){ // SHORT POSITION
            if(price >= this.entryPrice + this.settings.stopLoss){
                await this.access.placeMarketReduceOrder(this.settings.symbol, this.access.ENUM.LONG, this.positionAmount)
                this.openPosition = false;
                console.log(`Stop loss hit for short position\nCurrent Price: ${price}\nEntry Price: ${this.entryPrice}`)
                return true;
            }
        } else if (this.state === "Bullish"){ // LONG POSITION
            if(price <= this.entryPrice - this.settings.stopLoss){
                await this.access.placeMarketReduceOrder(this.settings.symbol, this.access.ENUM.SHORT, this.positionAmount)
                this.openPosition = false;
                console.log(`Stop loss hit for long position\nCurrent Price: ${price}\nEntry Price: ${this.entryPrice}`)
                return true;
            }
        }
    }


    async handleReversal(price){

        if(this.state === "Bearish"){ // SHORT POSITION
            if(price > this.ma200 && this.rsiValue > this.settings.rsiOverBought){
                await this.access.placeMarketReduceOrder(this.settings.symbol, this.access.ENUM.LONG, this.positionAmount)
                this.state = "Bullish";
                this.openPosition = false;
                // Reversal
                console.log("Reversal event in place for short position")
                await this.placeInitialOrder() // Internally saves initOrderId.
                return true;
            }
        } else if (this.state === "Bullish"){ // LONG POSITION
            if(price < this.ma200 && this.rsiValue < this.settings.rsiOverSold){
                await this.access.placeMarketReduceOrder(this.settings.symbol, this.access.ENUM.SHORT, this.positionAmount)
                this.state = "Bearish";
                this.openPosition = false;
                // Reversal
                console.log("Reversal event in place for long position")
                await this.placeInitialOrder() // Internally saves initOrderId.
                return true;
            }
        }
        return false
    }

    async placeInitialOrder(){ // Must stay the same
        let {highestBid, lowestAsk} = await this.access.highestBidLowestAsk(this.settings.symbol);
        if(this.state === "Bearish"){
            this.initOrderId = await this.access.placeLimitOrder(this.settings.symbol, this.access.ENUM.SHORT,
                this.settings.quantity, lowestAsk)

        } else if (this.state === "Bullish"){
            this.initOrderId = await this.access.placeLimitOrder(this.settings.symbol, this.access.ENUM.LONG,
                this.settings.quantity, highestBid)
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

    async handleContinuesMarketMaking(){
        if(this.mmOrderID !== null){
            await this.access.cancelSingleOrder(this.settings.symbol, this.mmOrderID)
            this.mmOrderID = null;
        }
        await this.placeMMOrders(); // Internally saves mmOrderID.
    }

    async placeMMOrders(){
        let {highestBid, lowestAsk} = await this.access.highestBidLowestAsk(this.settings.symbol);
        if(this.state === "Bearish"){
            this.mmOrderID = await this.access.placeLimitOrder(this.settings.symbol, this.access.ENUM.SHORT,
                this.settings.quantity, lowestAsk)

        } else if (this.state === "Bullish"){
            this.mmOrderID = await this.access.placeLimitOrder(this.settings.symbol, this.access.ENUM.LONG,
                this.settings.quantity, highestBid)
        }
    }

    /**
     * If you ever manually close or open a position while bot is active
     * there will be an additional active order that needs to be canceled.
     * Emir: If you want to manually change something, stop the bot then do it, most bots do advise that.
     * @returns {Promise<void>}
     */
    async tradeLoop(){
        await this.checkPosition(); // Internally updates openPosition. Sets entryPrice & Contract size.
        if(this.openPosition){
            this.initOrderId = null;
            await this.handlePosition(); // Calculates Rsi. Will change initOrderId in case of reversal event.
            if(this.openPosition)
                await this.handleContinuesMarketMaking(); // Handles mmOrderID
        } else{
            await this.handleState()
            await this.handleTrade() // Internally saves initOrderId. Calculates Rsi
        //    Wait for next loop - End of loop
        }
        console.log("Waiting for the next loop...\n\n")
    }

}

async function main(){
    let mm = new MarketMaker(Bybit, {})
    setInterval(async()=>{
        await mm.tradeLoop()
    }, 5000)
}

main()