const mongoose = require("mongoose");

const CustomerSchema = new mongoose.Schema({
    customer_name:{type:String,required:true},
    customer_mobile:{type:String,required:true, unique: [true,'customer mobile must be unique']},
  });

const Customers = mongoose.model("customers",CustomerSchema)

module.exports = {Customers}