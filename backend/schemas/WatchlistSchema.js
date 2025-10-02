const mongoose = require('mongoose');
const Schema = require('mongoose');

const WatchlistSchema = new mongoose.Schema({
    name: String,
    price: Number,
    percent: String,
    isDown: Boolean,
});

module.exports = WatchlistSchema;