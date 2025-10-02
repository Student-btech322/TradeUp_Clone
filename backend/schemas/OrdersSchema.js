const { Schema } = require("mongoose");
const mongoose = require('mongoose');

const OrdersSchema = mongoose.Schema({
  name: String,
  qty: Number,
  price: Number,
  mode: String,
});

module.exports = { OrdersSchema };