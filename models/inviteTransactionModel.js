const mongoose = require("mongoose");

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
});

const InviteTransactions = mongoose.model("InviteTransactions", InviteTransactionSchema);

module.exports = { InviteTransactions };
