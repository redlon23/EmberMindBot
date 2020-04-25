const crypto = require("crypto")

class ApiAccess{
    constructor(){}

    _getSignature(requestParams) {
        return crypto.createHmac('sha256', this.secret).update(requestParams, "utf-8").digest('hex')
    }

    async getAccountInformation(){throw new Error("Abstract method!");}

    async getAccountBalance(){throw new Error("Abstract method!");}

    async getOrderBook(symbol){throw new Error("Abstract method!");}

    async getSymbolPriceTicker(symbol){throw new Error("Abstract method!");}

    async changeLeverage(symbol, leverage){throw new Error("Abstract method!");}

    async getOpenOrders(symbol){throw new Error("Abstract method!");}

    async cancelAllOpenOrders(symbol){throw new Error("Abstract method!");}

    async cancelSingleOrder(symbol, orderId){throw new Error("Abstract method!");}

    async cancelMultipleOrders(symbol, orderIdLst){throw new Error("Abstract method!");}

    
}

module.exports = ApiAccess;