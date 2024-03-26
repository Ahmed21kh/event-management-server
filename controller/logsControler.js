const fs = require('fs');
const path = require('path');
const logger = require('../logger');



const downloadLogs = (req,res) =>{
    const filePath = path.join(__dirname, '../whatsapp.log');
    if (fs.existsSync(filePath)) {
      res.download(filePath, 'whatsapp-log.txt', (err) => {
        if (err) {
          logger.error('Error downloading log file:', err);
        } else {
          logger.info('Log file downloaded.');
        }
      });
    } else {
      res.status(404).send('Log file not found');
    }
  } 
  
  
  const cleareLogs = (req,res) =>{
    const filePath = path.join(__dirname, '../whatsapp.log');
    if (fs.existsSync(filePath)) {
      logger.info("Log File exist ")
      fs.writeFile(filePath, '', (err) => {
        if (err) {
          logger.error('Error clearing log file:', err);
          res.status(500).send('Error clearing log file');
  
        } else {
          logger.info('Log file cleared successfully');
          res.status(200).send('Log file cleared successfully');
  
        }
      });
    } else {
      res.status(404).send('Log file not found');
    }
  }

module.exports = { downloadLogs , cleareLogs}