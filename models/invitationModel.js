const mongoose = require("mongoose");

const InvitationSchema = new mongoose.Schema({
    invite_name:{type:String,required: true},
    from_date:{type:Date}, 
    to_date:{type:Date},
    invite_desc:{type:String} 
  });
  const Invitations = mongoose.model("invitations", InvitationSchema);
module.exports = {Invitations}