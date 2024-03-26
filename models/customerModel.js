const mongoose = require("mongoose");
const options = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false // Use 24-hour format
 };
const CustomerSchema = new mongoose.Schema({
    customer_name:{type:String,required:true},
    customer_mobile:{type:String,required:true, unique: [true,'customer mobile must be unique']},
  },{timestamps:{
    currentTime:  () => new Date().toLocaleDateString('en-CA',options), // Use Unix time
    createdAt: 'created_at', // Custom name for createdAt
    updatedAt: 'updated_at'
  }});

const Customers = mongoose.model("customers",CustomerSchema)

module.exports = {Customers}