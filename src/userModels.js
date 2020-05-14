const User = require('./user')
const crypto = require('crypto')
const util = require('util')
const scrypt = util.promisify(crypto.scrypt)

exports.getAllUsers = async () => {
	try {
		var result = await User.find({ exchange: { $ne: 'None' }, publicAPI: { $exists: true }, secretAPI: { $exists: true } });
		result.forEach(user => {
			//console.log(user)
			if (user.publicAPI != undefined && user.publicAPI != null) {
				user.publicAPI = decrypt(user.publicAPI);
			}
			if (user.secretAPI != undefined && user.secretAPI != null) {
				user.secretAPI = decrypt(user.secretAPI);
			}
			//console.log(user);
		});
	} catch (err) {
		console.log(err)
		result = null
	} finally {
		return result
	}
}

var config = {
	cryptkey: crypto.createHash('sha256').update('asehtlknajsbipqmanckkahdfs').digest(),
	iv: 'a2xhcgAAAAAAAAAA'
}

function decrypt(text) {
	if (text === null || typeof text === 'undefined' || text === '') {
		return text;
	}
	var decipher = crypto.createDecipheriv('aes-256-cbc', config.cryptkey, config.iv);
	return Buffer.concat([
		decipher.update(text, 'base64'), // Expect `text` to be a base64 string
		decipher.final()
	]).toString();
}
