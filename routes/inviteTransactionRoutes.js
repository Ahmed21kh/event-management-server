const express = require('express');
const router = express.Router()
const inviteTransactionController = require("../controller/inviteTransactionControler");
const bodyParser = require('body-parser');

router.post('/add-invitation_transaction', bodyParser.json({ extended: true }),inviteTransactionController.addInviteTransaction)
router.get('/get-invitation_transactions',inviteTransactionController.getInviteTransactions)
router.patch('/update-invitation_transaction', bodyParser.json({ extended: true }),inviteTransactionController.updateInviteTransaction)

module.exports = router