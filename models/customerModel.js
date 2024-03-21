const mongoose = require("mongoose");

const CustomerSchema = new mongoose.Schema({
    customer_name:{type:String,required:true},
    customer_mobile:{type:String,required:true, unique: [true,'customer mobile must be unique']},
    invitation:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'invitation'
    },
    isAttend:{type:Boolean,required:true},
    isSend:{type:Boolean,required:true}
  });

const Customers = mongoose.model("customers",CustomerSchema)

module.exports = {Customers}