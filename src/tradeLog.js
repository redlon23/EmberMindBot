const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TradeLog = new Schema ({
    strategyId: { type: Schema.Types.ObjectId, required: true },
    orderId: { type: String, required: true },
    entryPrice: { type: Number, required: true },
    startDate: { type: Date, required: true },
    closePrice: { type: Number, required: false },
    closeDate: { type: Date, required: false },
    currency: { type: String, required: false},
    quantity: { type: Number, required: true },
    orderType: { type: String, required: true } //buy or sell
});

module.exports = mongoose.model('TradeLog', TradeLog, 'tradeLogs')
