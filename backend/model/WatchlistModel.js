const mongoose = require('mongoose');
const WatchlistSchema = require("../schemas/WatchlistSchema.js");

const WatchlistModel = mongoose.model("watchlists", WatchlistSchema)

module.exports = {WatchlistModel};