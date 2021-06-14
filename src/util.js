const URL = require('url').URL;

function prepareKey(str, ignoreSearchQuery) {
	try {
		const url = new URL(str);
		return ignoreSearchQuery ? url.pathname : url.pathname + url.search;
	} catch (_) {
		if (ignoreSearchQuery) {
			return str.split('?')[0];
		}
		return str;
	}
}

module.exports = {
	prepareKey
};