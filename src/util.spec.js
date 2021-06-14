const utils = require('./util');

test('it should remove the protocol, domain and port from URL', () => {
	const url1 = 'http://www.example.com:4000/user/123';
	expect(utils.prepareKey(url1)).toBe('/user/123');

	const url2 = 'http://www.example.com:4000/user/123?age=42';
	expect(utils.prepareKey(url2)).toBe('/user/123?age=42');
});

test('it should return the same value if there is no protocol/domain', () => {
	const url1 = '/user/123';
	expect(utils.prepareKey(url1)).toBe('/user/123');
});

test('it should not include search query if ignoreSearchQuery is true', () => {
	const url1 = 'http://www.example.com:4000/user/123?age=42';
	expect(utils.prepareKey(url1, true)).toBe('/user/123');

	const url2 = '/user/123?age=42';
	expect(utils.prepareKey(url2, true)).toBe('/user/123');
});

