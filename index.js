/**
 * Set up express
 */
const express = require('express');
const app = express();
const port = 3000;
const bodyParser = require('body-parser');
const conf = require('./conf/known-rest-api');
const util = require('./src/util');

/**
 * Set up for displaying home page
 */
const fs = require('fs');
const readme = fs.readFileSync('./README.md', 'utf8');
const showdown = require('showdown');
const converter = new showdown.Converter();
const homepage = converter.makeHtml(readme);

/**
 * Set up Mongoose
 */
const mongoose = require('mongoose');
const mongodbUrl = 'mongodb://mongo:27017/mockrestapi';

mongoose.connect(mongodbUrl, {useNewUrlParser: true, useUnifiedTopology: true});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error 😢'));
db.once('open', function () {
    console.log('Connected to DB v4.4🚀');
});

/**
 * Schema
 */
const responseSchema = new mongoose.Schema({
    key: String,
    method: String,
    headers: {},
    body: {},
});

// Mocks is the name of mongo db collection
const Response = mongoose.model('Response', responseSchema);
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({
    limit: '50mb',
    extended: true,
    parameterLimit: 50000
}));

app.get('/', (req, res) => {
    res.send(homepage);
});

app.post('/_save_', (req, res) => {
    const data = req.body;
    if (!data.key) {
        return res.status(400).send('Missing attribute: "key"');
    }
    if (!data.body) {
        return res.status(400).send('Missing attribute: "body"');
    }

	const key = util.prepareKey(data.key, true);
    Response.findOneAndUpdate(
        {
            key: key,
        },
        {
            key: key,
            method: data.method,
            headers: data.headers ? data.headers : null,
            body: data.body
        },
        {
            upsert: true,
            useFindAndModify: false
        }, (err, response) => {
            if (err) {
                console.error(err);
                res.send('Problem while saving record :', err);
            }
            res.send('Entry saved');
        });
});


app.all('*', (req, res, next) => {
	const key = util.prepareKey(req.originalUrl, true);
    Response.findOne({
		key: key
    }, (err, response) => {
        if (err) {
            console.error(err);
            res.status(400).send('System error');
        } else if (!response || !response.body) {
            console.log('Not found: ' + req.path);
            res.status(404).send('Not found');
        } else {
            res.setHeader("Access-Control-Allow-Headers", "X-Requested-With,content-type, Accept,Authorization,Origin");
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
            res.setHeader("Access-Control-Allow-Credentials", true);

            res.send(response.body);
        }
        next();
    });
});

app.listen(port, () => {
    console.log(`Mock REST API is listening at http://localhost:${port}`);
});