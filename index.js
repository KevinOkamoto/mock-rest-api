/**
 * Set up express
 */
const express = require('express');
const app = express();
const port = 3000;

/**
 * Set up Mongoose
 */
const mongoose = require('mongoose');
const mongodbUrl = 'mongodb://mongo:27017/mockrestapi';

mongoose.connect(mongodbUrl, {useNewUrlParser: true, useUnifiedTopology: true});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error 😢'));
db.once('open', function() {
    console.log('Connected to DB 🚀');
});

/**
 * Schema
 */
const responseSchema = new mongoose.Schema({
    key: String,
    method: String,
    header: String,
    body: String,
});
const Response = mongoose.model('Response', responseSchema);

app.get('/_intro_', (req, res) => {
    res.send('Hello World!');
});

app.post('/_save_', (req, res) => {
    const data = req.body;
    const response = new Response({
        key: data.path,
        method: data.method,
        header: null,
        body: JSON.stringify(data.body)
    });
    response.save((err, response) => {
       if (err) return console.error(err);
       res.send('Saved entry');
    });
});

app.all('*', (req, res, next) => {
    Response.find({
        key: req.path
    }, (response) => {
        if (response) {
            res.send(JSON.parse(response.body));
        }
    });
    next();
});

app.listen(port, () => {
    console.log(`Mock REST API is listening at http://localhost:${port}`);
});