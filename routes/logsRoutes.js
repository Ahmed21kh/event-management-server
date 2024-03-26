const express = require("express");
const { downloadLogs, cleareLogs } = require("../controller/logsControler");
const router = express.Router();

router.get("/download-logs", downloadLogs);
router.post("/cleare-logs", cleareLogs);

module.exports = router;