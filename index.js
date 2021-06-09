/**
 * Set up express
 */
const express = require('express');
const app = express();
const port = 3000;

const bodyParser = require('body-parser');

/**
 * Set up Mongoose
 */
const mongoose = require('mongoose');
const mongodbUrl = 'mongodb://mongo:27017/mockrestapi';

mongoose.connect(mongodbUrl, {useNewUrlParser: true, useUnifiedTopology: true});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error 😢'));
db.once('open', function() {
    console.log('Connected to DB 🚀');
});

/**
 * Schema
 */
const responseSchema = new mongoose.Schema({
    key: String,
    method: String,
    headers: String,
    body: String,
});
const Response = mongoose.model('Response', responseSchema);

app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.post('/_save_', (req, res) => {
    const data = req.body;
    if (!data.key) {
        return res.status(400).send('Missing attribute: "key"');
    }
    if (!data.body) {
        return res.status(400).send('Missing attribute: "body"');
    }
    const response = new Response({
        key: data.key,
        method: data.method,
        headers: data.headers ? JSON.stringify(data.headers): null,
        body: JSON.stringify(data.body)
    });
    response.save((err, response) => {
       if (err) return console.error(err);
       res.send('Entry saved');
    });
});

app.all('*', (req, res, next) => {
    Response.findOne({
        key: req.path
    }, (err, response) => {
        if (err) {
            console.error(err);
            res.status(400).send('System error');
        } else if (!response || !response.body) {
            console.log('Not found: ' + req.path);
            res.status(404).send('Not found');
        } else  {
            res.send(JSON.parse(response.body));
        }
        next();
    });
});

app.listen(port, () => {
    console.log(`Mock REST API is listening at http://localhost:${port}`);
});