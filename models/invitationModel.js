const mongoose = require("mongoose");
const moment = require("moment-timezone");

const InvitationSchema = new mongoose.Schema({
    invite_name:{type:String,required: true},
    from_date:{type:Date,required: true}, 
    to_date:{type:Date,required: true},
    invite_desc:{type:String,required: true} 
  },{timestamps:{
    currentTime: () => Date.now(), // Use Unix time
    createdAt: 'created_at', // Custom name for createdAt
    updatedAt: 'updated_at'
  }});
  const Invitations = mongoose.model("invitations", InvitationSchema);
module.exports = {Invitations}