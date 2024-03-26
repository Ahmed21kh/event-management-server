const mongoose = require("mongoose");

const CustomerSchema = new mongoose.Schema({
    customer_name:{type:String,required:true},
    customer_mobile:{type:String,required:true, unique: [true,'customer mobile must be unique']},
  },{timestamps:{
    currentTime:  () => Date.now(), // Use Unix time
    createdAt: 'created_at', // Custom name for createdAt
    updatedAt: 'updated_at'
  }});

const Customers = mongoose.model("customers",CustomerSchema)

module.exports = {Customers}