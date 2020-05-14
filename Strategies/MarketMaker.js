const {Bybit, Binance} = require("../Apis/Common");

class MarketMaker{
    constructor(ApiAccess, settings, pblic, secret) {
        this.access = new ApiAccess(pblic, secret);
        this.state = ''
        this.openPosition = false;
        this.settings = {rsiKlinePeriod: "1m", symbol: "BTCUSDT",
            quantity: 0.01, stopLoss: 100, takeProfit: 100,
            rsiOverBought: 51, rsiOverSold: 49};
        this.ma200 = 0.0;
        this.rsiValue = 0.0;
        this.entryPrice = 0.0;
        this.initOrderId = null;
        this.mmOrderID = null;
        this.positionAmount = 0.0;
        this.inProfit = false // Check where its changed.
        this.takeProfitId = null;
    }

    /**
     * Decides state by checking moving average gains price.
     * @returns {Promise<void>}
     */
    async handleState(){
        this.ma200 = await this.access.getNMinuteMovingAverage(this.settings.symbol, 200);
        let currentPrice = await this.access.getSymbolPrice(this.settings.symbol);
        this._decideState(this.ma200, currentPrice);
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

    /**
     * Handles placing initial order for trade.
     * Also responsible for canceling initOrderId
     * @returns {Promise<void>}
     */
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

    /**
     * Handles position by comparing price with entryPrice to
     * see if there is an reversal & take profit & stop loss.
     * @returns {Promise<void>}
     */
    async handlePosition(){
        await this.checkRsi()
        let price = await this.access.getSymbolPrice(this.settings.symbol)
        // Check if Position is profit for disabling continues MarketMaking.
        this.inProfit = (this.state === "Bullish" && price > this.entryPrice)
            || (this.state === "Bearish" && price < this.entryPrice);
        let isReversal = await this.handleReversal(price) // Internally places reversal orders.
        if(!isReversal){
            console.log("No Reversal event, checking tp and sl...")
            let res = await this.checkTakeProfit(price)
           if(!res){
               await this.checkStopLoss(price);
           }
        }
    }

    /**
     * Depending on state, compares price with moving average and
     * current rsi with user input of rsiOverBought & rsiOverSold
     * Closes the position with market reduce order.
     * Then tries to open another position with placeInitialOrder.
     * @param price
     * @returns {Promise<boolean>}
     */
    async handleReversal(price){
        if(this.state === "Bearish"){ // SHORT POSITION
            if(price > this.ma200 && this.rsiValue > this.settings.rsiOverBought){
                if(this.mmOrderID)
                    await this.access.cancelSingleOrder(this.settings.symbol, this.mmOrderID);
                let data = await this.access.placeMarketReduceOrder(this.settings.symbol, this.access.ENUM.LONG, this.positionAmount, this.access.ENUM.GOODTILLCANCEL)
                console.log(data)
                this.state = "Bullish";
                this.openPosition = false;
                // Reversal
                console.log("Reversal event in place for short position")
                await this.placeInitialOrder() // Internally saves initOrderId.
                return true;
            }
        } else if (this.state === "Bullish"){ // LONG POSITION
            if(price < this.ma200 && this.rsiValue < this.settings.rsiOverSold){
                if(this.mmOrderID)
                    await this.access.cancelSingleOrder(this.settings.symbol, this.mmOrderID);
                await this.access.placeMarketReduceOrder(this.settings.symbol, this.access.ENUM.SHORT, this.positionAmount, this.access.ENUM.GOODTILLCANCEL)
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

    /**
     * Depending on state, compares price against user input of takeProfit.
     * Tries to closes the position with limit order.
     * Changes openPosition to false if conditions are met.
     * @param price Current Price.
     * @returns  boolean Position closed or not.
     */
    async checkTakeProfit(price){ // Todo: Change this to limit order
        if(this.state === "Bearish"){ // SHORT POSITION
            if(price + this.settings.takeProfit <= this.entryPrice){
                return await this.takeProfitLoop()
                // this.openPosition = false;
                // console.log(`Take profit hit for short position\nCurrent Price: ${price}\nEntry Price: ${this.entryPrice}\nPosition Size: ${this.positionAmount}`)
            }
        } else if (this.state === "Bullish"){ // LONG POSITION
            if(price - this.settings.takeProfit >= this.entryPrice){
                return await this.takeProfitLoop()
                // this.openPosition = false;
                // console.log(`Take profit hit for long position\nCurrent Price: ${price}\nEntry Price: ${this.entryPrice}\nPosition Size: ${this.positionAmount}`)
            }
        }
    }

    /**
     * Depending on state, compares price against user input of stopLoss
     * Closes the position with market reduce order.
     * Changes openPosition to false if conditions are met
     * @param price Current Price.
     * @returns boolean Position closed or not.
     */
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

    async placeInitialOrder(){ // Must stay the same
        let {highestBid, lowestAsk} = await this.access.highestBidLowestAsk(this.settings.symbol);
        if(this.state === "Bearish"){
            this.initOrderId = await this.access.placeLimitOrder(this.settings.symbol, this.access.ENUM.SHORT,
                this.settings.quantity, lowestAsk, this.access.ENUM.GOODTILLCANCEL)

        } else if (this.state === "Bullish"){
            this.initOrderId = await this.access.placeLimitOrder(this.settings.symbol, this.access.ENUM.LONG,
                this.settings.quantity, highestBid, this.access.ENUM.GOODTILLCANCEL)
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

    async handleContinuesMarketMaking(){
        if(this.mmOrderID !== null){
            console.log("Cancel older MarketMaking order...")
            await this.access.cancelSingleOrder(this.settings.symbol, this.mmOrderID)
            this.mmOrderID = null;
        }
        // Stop MarketMaking when in profit.
        if(!this.inProfit)
            await this.placeMMOrders(); // Internally saves mmOrderID.
    }

    async placeMMOrders(){
        let {highestBid, lowestAsk} = await this.access.highestBidLowestAsk(this.settings.symbol);
        if(this.state === "Bearish"){
            this.mmOrderID = await this.access.placeLimitOrder(this.settings.symbol, this.access.ENUM.SHORT,
                this.settings.quantity, lowestAsk, this.access.ENUM.GOODTILLCANCEL)
            console.log(`New MM order with id: ${this.mmOrderID}`)
        } else if (this.state === "Bullish"){
            this.mmOrderID = await this.access.placeLimitOrder(this.settings.symbol, this.access.ENUM.LONG,
                this.settings.quantity, highestBid, this.access.ENUM.GOODTILLCANCEL)
            console.log(`New MM order with id: ${this.mmOrderID}`)
        }
    }

    /**
     * If you ever manually close or open a position while bot is active
     * there will be an additional active order that needs to be canceled.
     * Emir: If you want to manually change something, stop the bot then do it, most bots do advise that.
     * @returns {Promise<void>}
     */
    async tradeLoop(){
        //TODO: check internal flag.
        await this.checkPosition(); // Internally updates openPosition. Sets entryPrice & Contract size.
        if(this.openPosition){
            this.initOrderId = null;
            await this.handlePosition(); // Calculates Rsi. Will change initOrderId in case of reversal event.
            console.log(`Position still open for Continues MM: ${this.openPosition}`)
            if(this.openPosition)
                await this.handleContinuesMarketMaking(); // Handles mmOrderID
            else if(this.mmOrderID !== null){
                await this.access.cancelSingleOrder(this.settings.symbol, this.mmOrderID)
            }
        } else{
            await this.handleState()
            await this.handleTrade() // Internally saves initOrderId. Calculates Rsi
        //    Wait for next loop - End of loop
        }
        console.log("Waiting for the next loop...\n\n")
    //    TODO: Check bot flag then change internal flag.
    }

    /**
     * Tries to find an open position and changes the openPosition.
     * If position amount is not 0, it populates position details.
     * @returns {Promise<void>}
     */
    async checkPosition(){
        let [positionAmount, positionEntryPrice, side] = await this.access.checkPosition(this.settings.symbol);
        if(positionAmount > this.positionAmount){
            this.mmOrderID = null;
            this.positionAmount = positionAmount
            this.openPosition = true
            this.entryPrice = positionEntryPrice;
            if(side === this.access.ENUM.LONG){
                this.state = "Bullish";
            }else if(side === this.access.ENUM.SHORT){
                this.state = "Bearish";
            }
            console.log(`Open Position with entry price: ${positionEntryPrice}, side: ${side}`);
            return;
        } else if(positionAmount === 0){
            this.openPosition = false;
            this.entryPrice = 0;
            this.positionAmount = 0;
        }
        console.log("There is no open position || No Position Change")
    }

    async sleep(ms){
        await new Promise(r => setTimeout(r, ms));
    }

    async takeProfitLoop() {
        if(this.mmOrderID)
            await this.access.cancelSingleOrder(this.settings.symbol, this.mmOrderID)
        while(this.openPosition){
            let price = await this.access.getSymbolPrice(this.settings.symbol);
            if(this.state === "Bearish"){ // SHORT POSITION
                if(price + this.settings.takeProfit <= this.entryPrice){
                    if(this.takeProfitId)
                        await this.access.cancelSingleOrder(this.settings.symbol, this.takeProfitId)
                    this.takeProfitId = await this.access.placeLimitReduceOrder(this.settings.symbol, this.access.ENUM.LONG, this.positionAmount, price + 1, this.access.ENUM.GOODTILLCANCEL)
                    console.log(`Take profit limit order placed for short position`)
                } else{
                    console.log(`No longer in profit... Going back to trade loop`)
                    if(this.takeProfitId){
                        await this.access.cancelSingleOrder(this.settings.symbol, this.takeProfitId)
                        this.takeProfitId = null;
                    }
                    return false;
                }
            } else if (this.state === "Bullish"){ // LONG POSITION
                if(price - this.settings.takeProfit >= this.entryPrice){
                    if(this.takeProfitId)
                        await this.access.cancelSingleOrder(this.settings.symbol, this.takeProfitId)
                    this.takeProfitId = await this.access.placeLimitReduceOrder(this.settings.symbol, this.access.ENUM.SHORT, this.positionAmount, price - 1, this.access.ENUM.GOODTILLCANCEL)
                    console.log(`Take profit limit order placed for long position`)
                } else {
                    console.log(`No longer in profit... Going back to trade loop`)
                    if(this.takeProfitId){
                        await this.access.cancelSingleOrder(this.settings.symbol, this.takeProfitId)
                        this.takeProfitId = null;
                    }
                    return false;
                }
            }
            console.log("Sleeping....")
            await this.sleep(15000)
            console.log("Waking up...")
            let pos = await this.access.checkPosition(this.settings.symbol)
            if (pos[0] === 0)
                this.openPosition = false
        }
        this.takeProfitId = null;
        console.log("Out of take profit loop")
        return true;
    }

}

async function main(){
    // let pblic = process.argv[2], secret = process.argv[3];
    let pblic = 'kkbceTwJmL51V3Gdg2', secret = "O6dVZ8PbDT3KAFNNk5OHMTee2XIWReLfgOKN";
    let mm = new MarketMaker(Bybit, {}, pblic, secret)
    await mm.tradeLoop()
    setInterval(async()=>{
        await mm.tradeLoop()
    }, 30000)
}

main()