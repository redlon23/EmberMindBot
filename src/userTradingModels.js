const UserStrategySetting = require('./schemas/userStrategySetting')
const Strategy = require('./schemas/strategy')
const TradeLog = require('./schemas/tradeLog')

exports.getStrategySetting = async (req) => {
	try {
		var result = await UserStrategySetting.findOne({ userId: req.userId, strategyId: req.strategyId })
	} catch (err) {
		console.log(err)
		result = null
	} finally {
		return result
	}
}
