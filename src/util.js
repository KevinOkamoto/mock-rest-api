const URL = require('url').URL;

function prepareKey(str) {
	try {
		const url = new URL(str);
		return url.pathname + url.search;
	} catch (_) {
		return str;
	}
}

module.exports = {
	prepareKey
};