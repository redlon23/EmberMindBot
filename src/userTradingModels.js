const UserStrategySetting = require('./userStrategySetting')
// const Strategy = require('./strategy')
// const TradeLog = require('./tradeLog')

exports.getStrategySetting = async (req) => {
	try {
		var result = await UserStrategySetting.findOne({ userId: req.userId, strategyName: req.strategyName })
	} catch (err) {
		console.log(err)
		result = null
	} finally {
		return result
	}
}
