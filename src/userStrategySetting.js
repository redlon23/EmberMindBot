const mongoose = require('mongoose')
const Schema = mongoose.Schema

const UserStrategySetting = new Schema(
	{
		userId: { type: Schema.Types.ObjectId, required: true, ref: 'users', unique: false },
		strategyName: { type: String, required: true, ref: 'strategies' },
		strategyIsEquipped: { type: Boolean, required: true, default: true },
		supportedSettings: { type: Array, required: true, default: [ 'contractQuantity', 'takeProfit', 'stopLoss' ] },
		contractQuantity: { type: Number },
		takeProfit: { type: Number },
		stopLoss: { type: Number },
		tradeInterval: { type: Number },
		maxContractSize: { type: Number },
		DCA: { type: Boolean, default: true },
		numOrders: { type: Number },
		spread: { type: Boolean, default: true },
		orderSpread: { type: Number },
		trailingSafety: { type: Number },
		trailingStop: { type: Number },
		noTradingZoneSize: { type: Number },
		noTradingZoneRange: { type: Number }
	},
	{
		versionKey: false
	}
)

module.exports = mongoose.model('UserStrategySetting', UserStrategySetting, 'userStrategySettings')
