const mongoose = require('mongoose')
const Schema = mongoose.Schema

const User = new Schema({
	name: { type: String, required: true },
	email: { type: String, required: true, unique: true },
	password: { type: String, required: true },
	exchange: { type: String, required: false, default: 'None' },
	publicAPI: { type: String, required: false },
	secretAPI: { type: String, required: false },
	tradingEnabled: { type: Boolean, required: true, default: false },
	subscription: {
		lastPayment: { type: Date, required: false, default: new Date().toISOString() },
		//7 day free trial default, next payment due 7 days from today
		nextPayment: { type: Date, required: false, default: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString() },
		subscriptionType: { type: String, required: false, default: 'Trial' },
		subscribed: { type: Boolean, required: true, default: false },
		isRecurring: { type: Boolean, required: true, default: false },
		paymentRecords: { type: Array, required: false }
	}
})

module.exports = mongoose.model('User', User, 'users')
