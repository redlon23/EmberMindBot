const crypto = require("crypto")


/**
 * Api Access represents standartize way of of interacting with
 * exchange api.
 * This Abstract class only displays required functionality.
 * All api implementations must implement its methods.
 */
class ApiAccess{
    constructor(){}

    _getSignature(requestParams) {
        return crypto.createHmac('sha256', this.secret).update(requestParams, "utf-8").digest('hex')
    }

 // === Check Price =====

 async getOrderBook(symbol){throw new Error("Abstract method!");}

 async getSymbolPriceTicker(symbol){throw new Error("Abstract method!");}

 // === Check Position ===

 async getPositions(){throw new Error("Abstract method!");}

 //  ===== Place Order ===

 async placeLimitOrder(){throw new Error("Abstract method!");}

 async placeMarketOrder(){throw new Error("Abstract method!");}

 // ==== Cancel Order ====

 async cancelSingleOrder(){throw new Error("Abstract method!");}

 async cancelMultipleOrders(){throw new Error("Abstract method!");}

 async cancelAllOpenOrders(){throw new Error("Abstract method!");}

}

module.exports = ApiAccess;