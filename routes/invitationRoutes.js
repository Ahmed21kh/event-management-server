const express = require('express');
const router = express.Router()
const invitationController = require("../controller/invitationControler");
const bodyParser = require('body-parser');

router.post('/add-invitation', bodyParser.json({ extended: true }),invitationController.addInvitation)
router.get('/get-invitations',invitationController.getInvitations)
router.get('/all-invitations',invitationController.getAllInvitations)

module.exports = router