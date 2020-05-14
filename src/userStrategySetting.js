const mongoose = require('mongoose')
const Schema = mongoose.Schema

const UserStrategySetting = new Schema(
	{
		userId: { type: Schema.Types.ObjectId, required: true, ref: 'users', unique: false },
		strategyName: { type: String, required: true, ref: 'strategies' },
		strategyIsEquipped: { type: Boolean, required: true, default: true },
		requiredSettings: { type: Array, required: true },
		optionalSettings: { type: Array },

		// Settings
		// NOTE: If you add or subtract settings here, change them in the allSettingsDefault object in userTradingModels.js too.
		// NOTE: Also change them in this.renderSetting in StrategySettingsForm.
		DCA: { type: Boolean },
		maxContractSize: { type: Number },
		noTradingZoneSize: { type: Number },
		noTradingZoneRange: { type: Number },
		numOrders: { type: Number },
		orderSpread: { type: Number },
		quantity: { type: Number },
		rsiKlinePeriod: { type: Number },
		rsiOverBought: { type: Number },
		rsiOverSold: { type: Number },
		spread: { type: Boolean },
		stopLoss: { type: Number },
		takeProfit: { type: Number },
		tradeInterval: { type: Number },
		trailingSafety: { type: Number },
		trailingStop: { type: Number }
	},
	{
		versionKey: false
	}
)

module.exports = mongoose.model('UserStrategySetting', UserStrategySetting, 'userStrategySettings')
