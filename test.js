/**
 * Set up express
 */
const conf = require('./conf/known-rest-api');


const url = "http://localhost:3000/gb/usercontext?gbst=null&realm=cirrusatlanticsuite&isoauth=false";


const matched = conf["rest-uri"].filter((uri) => {
    const escaped = uri.replace(/[-\/\\^$+?()|[\]{}]/g, '\\$&').replace('https', '(http|https)');
    console.log(escaped)
    expression = new RegExp(escaped);
    return expression.test(url);
});


console.log(matched)