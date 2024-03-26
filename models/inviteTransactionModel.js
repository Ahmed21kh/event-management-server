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
const InviteTransactionSchema = new mongoose.Schema({
  invitation_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "invitations",
  },
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "customers",
  },
  attendance_status: { type: String, required: true },
  sending_status: { type: String, required: true },
},{timestamps:{
  currentTime: () => new Date().toLocaleDateString('en-CA',options), // Use Unix time
  createdAt: 'created_at', // Custom name for createdAt
  updatedAt: 'updated_at'
}});

const InviteTransactions = mongoose.model("InviteTransactions", InviteTransactionSchema);

module.exports = { InviteTransactions };
