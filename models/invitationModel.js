const mongoose = require("mongoose");
const moment = require("moment-timezone");
const options = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false // Use 24-hour format
 };
const InvitationSchema = new mongoose.Schema({
    invite_name:{type:String,required: true},
    from_date:{type:Date,required: true}, 
    to_date:{type:Date,required: true},
    invite_desc:{type:String,required: true} 
  },{timestamps:{
    currentTime: () => new Date().toLocaleDateString('en-CA',options), // Use Unix time
    createdAt: 'created_at', // Custom name for createdAt
    updatedAt: 'updated_at'
  }});
  const Invitations = mongoose.model("invitations", InvitationSchema);
module.exports = {Invitations}