const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TradeLog = new Schema ({
    strategyId: { type: Schema.Types.ObjectId, required: true, ref:'strategies' },
    userId: { type: Schema.Types.ObjectId, required: true, ref:'users' },
    orderId: { type: String, required: true },
    entryPrice: { type: Number, required: true },
    startDate: { type: Date, required: true },
    closePrice: { type: Number, required: false },
    closeDate: { type: Date, required: false },
    currency: { type: String, required: false},
    quantity: { type: Number, required: true },
    side: { type: String, required: true } //buy or sell
});

module.exports = mongoose.model('TradeLog', TradeLog, 'tradeLogs')
