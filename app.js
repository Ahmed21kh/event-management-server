const express = require('express')
const mongoClient = require('mongodb').MongoClient
const livereload = require("livereload")
const bodyparser = require("body-parser")
const path = require("path")
const mongoose = require("mongoose")
const cors = require("cors")
// const url = "mongodb://127.0.0.1:27017/Agents"
const url = "mongodb+srv://AhmedKh:mongo@cluster0.xrny0xe.mongodb.net/Agents"
const connectLivereload = require("connect-livereload")
const multer = require("multer")
const fs = require("fs")
const app = express();
const port = 5050;
const router = express.Router();
const customerRoute = require("./routes/customerRoutes")
const invitationRoute = require("./routes/invitationRoutes")
const inviteTransactionRoute = require("./routes/inviteTransactionRoutes")
const logsRoute = require("./routes/logsRoutes")
const {
    Client,
    LegacySessionAuth,
    LocalAuth,
    RemoteAuth,
    MessageMedia,
  } = require("whatsapp-web.js");
const logger = require('./logger')
const { InviteTransactions } = require('./models/inviteTransactionModel')
const objectId = require("mongodb").ObjectId;
require('dotenv').config();
app.set("view engine", "ejs")
app.set("views", "views")
app.use(bodyparser.json())
app.use(cors())
app.use("/api",customerRoute);
app.use("/api",invitationRoute);
app.use("/api",inviteTransactionRoute);
app.use("/api",logsRoute);
app.use('/uploads', express.static('uploads'));
const folderPath1 = path.join(__dirname, "uploads"); // Path to the folder

if (fs.existsSync(folderPath1)) {
  logger.info("Folder exists.");
} else {
  logger.info("Folder does not exist.");
  fs.mkdirSync(folderPath1, { recursive: true });
}
app.use( (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET,PATCH,PUT,POST,DELETE");
    res.header("Access-Control-Expose-Headers", "Content-Length");
    res.header(
      "Access-Control-Allow-Headers",
      "Accept, Authorization,x-auth-token, Content-Type, X-Requested-With, Range"
    );
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    } else {
      return next();
    }
  });
const server = require("http").createServer(app)
app.get('/', (req, res) => {
  res.send('Welcome to my server!');
});
const socketIo = require("socket.io")(server, {
    // pingTimeout :60000,
    transports: ["websocket"],
    // path:"/api",
    perMessageDeflate: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      allowedHeaders: ["my-custom-header"],
      credentials: true,
      // allowEIO3: true,
  
      // withCredentials: true
    },
  });
server.listen(port, () => {
    console.log("listening on port " + port)
    mongoose.connect(process.env.MONGO_DB_URI).then((clientdb)=>{
      // console.log(clientdb);
      console.log("connect to database");
      // clientdb.disconnect()
  
    })
  })

  module.exports = {socketIo}

  const clientsActivity = {};
  socketIo.on("connection", async (socket) => {
    clientsActivity[socket.id] = { lastActivity: Date.now() };
    const client = new Client({
        restartOnAuthFail: true,
        // authTimeoutMs:60000,
        puppeteer: {
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox", // Experimental [adding this 25/01 as it seems to resolve few known issues]
            "--disable-dev-shm-usage", // Experimental [adding this 25/01 as it seems to resolve few known issues]
            "--disable-background-timer-throttling",
            "--disable-backgrounding-occluded-windows",
            "--disable-renderer-backgrounding",
            "--use-gl=egl",
            "--disable-web-security",
            '--proxy-server="direct://"', // Attempt to increase performance
            "--proxy-bypass-list=*", // Attempt to increase performance
            "--disable-features=IsolateOrigins,site-per-process", // Needed to enable iframes
            "--lang=en-GB", // Experimental (to fix freezing)
            "--ignore-certificate-errors", // Experimental (to fix freezing)
            "--disable-accelerated-2d-canvas", // Experimental (to fix freezing)
            "--disable-gpu", // Experimental (to fix freezing)
            '--log-level=3', // fatal only
            '--start-maximized',
            '--no-default-browser-check',
            '--disable-infobars', 
            '--disable-site-isolation-trials',
            '--no-experiments',
            '--ignore-gpu-blacklist',
            '--ignore-certificate-errors-spki-list',
            '--disable-extensions',
            '--disable-default-apps',
            '--enable-features=NetworkService',
          ],
          handleSIGINT: false,
          headless: true,
          takeoverOnConflict: true,
          takeoverTimeoutMs: 6000,
          pingInterval: 10000,
          pingTimeout: 5000,
          qrTimeout: 10000,
          slowMo: 100,
        },
    
        authStrategy: new LocalAuth({
          clientId: "client",
        }),
      });
      const timer = (ms) => new Promise((res) => setTimeout(res, ms));

      client.on("qr", async (qr) => {
        // logger.info(qr);
        clientsActivity[socket.id].lastActivity = Date.now();
        socket.emit("Authenticated", false);
        logger.info(socket.id);
        logger.info("qr:" + " " + qr);
        await socket.emit("loading", false);
        await socket.emit("QRCODE", qr);
      });
    
      client.on("loading_screen", () => {
        clientsActivity[socket.id].lastActivity = Date.now();
        logger.info("loading screen");
        socket.emit("loading", true);
      });
    
      client.on("authenticated", async () => {
        clientsActivity[socket.id].lastActivity = Date.now();
        logger.info("Successfully authenticated");
      });
    
      client.on("ready", async () => {
        clientsActivity[socket.id].lastActivity = Date.now();
        logger.info("ready");
        socket.emit("isAuth", true);
        socket.emit("loading", false);
      });
    
      socket.on("Logout", async () => {
        clientsActivity[socket.id].lastActivity = Date.now();
        // try {
        await client
          .logout()
          .then((res) => {
            logger.info(" logged out successfully");
            logger.info("logged out successfully");
            socket.emit("LoggedOut", true);
          })
          .catch((err) => {
            logger.info(err);
            logger.error("error logout: ", err);
          })
          .finally(() => {
            logger.info("client logout completed");
          });
        await client
          .initialize()
          .then(() => logger.info("initialized"))
          .catch((err) => logger.error(err));
      });
      const sendMediaToAll = async (data) => {
        logger.info(JSON.stringify(data));
        let messageProgress = 0;
        logger.info("whatsappList =====>",JSON.stringify(data.whatsappList));
        for (let index = 0; index < data.whatsappList.length; index++) {
          const element = data.whatsappList[index];
          const chatId = element?.key + "@c.us";
          const message = element?.value;
          console.log("chatId ======>",chatId);
          console.log("message ======>",message);
          logger.info({ message: message, chatId: chatId });
          const pathOfImage = path.join(__dirname,`./uploads/${element?.id}.png`) 
          if (fs.existsSync(pathOfImage)) {
            const media = MessageMedia.fromFilePath(pathOfImage);
            await client
            .sendMessage(chatId,media ,{
              caption: message
            })
            .then(async (msg) => {
              // logger.info(msg);
              if (messageProgress <= 100) {
                messageProgress++;
                socket.emit("messageProgress", {
                  progress: Math.ceil((messageProgress / data.whatsappList.length) * 100),
                });
              }
              if (msg.hasMedia) {
                await msg.downloadMedia();
                // do something with the media data here
              }
            })
            .catch((err) => {
              logger.error(err);
              logger.error(err.message);
            })
            .finally( async() => {
             await InviteTransactions.findByIdAndUpdate(new objectId(element?.id),{sending_status:"sent"},{ new: true, upsert: false }).then((response) => {
                socket.emit("updatedData",response)
              }).catch((error) => {
               socket.emit("error",error.message)
              });
           });
              const path1 = path.join(
                __dirname,
                `./uploads/${element?.id}.png`
              );
             fs.unlinkSync(path1, (err) => {
                if (err) {
                   logger
                   .error(err);
                } else {
                   logger
                   .info("Delete File successfully.");
                }
               });
           await timer(1300);
          } 
          else {
            socket.emit("error",`this invitation is already sent to ${element?.id}`)
            return false;
          }
          }
    
        // }
      };
      socket.on("sendMediaToAll", (data) => {
        clientsActivity[socket.id].lastActivity = Date.now();
        sendMediaToAll(data).then((res) => {
          console.log(res);
          if (res === undefined) {
            socket.emit("success", "messages sent successfully ");
          }
        });
      });
      client.on("disconnected", (reason) => {
        logger.info(`Client disconnected due to ${reason}. Reconnecting...`);
        client
          .destroy()
          .then((da) => {
            logger.info("client destroyed");
          })
          .catch((err) => {
            logger.info(err);
          });
      });
      socket.on("disconnect", async () => {
        delete clientsActivity[socket.id];
        logger.info("socket disconnected");
        try {
          await client
            .getState()
            .then(async (state) => {
              logger.info(state);
              logger.info(state);
              if (state === "CONNECTED" || state === "PAIRING") {
                await client
                  .destroy()
                  .then((res) => {
                    logger.info("client destroyed");
                    logger.info("client destroyed");
                  })
                  .catch((err) => {
                    logger.info("error");
    
                    logger.error(err);
                  });
              } else {
                //  startClient()
                await client
                  .destroy()
                  .then((res) => {
                    logger.info("client destroyed");
    
                    logger.info("client destroyed");
                  })
                  .catch((err) => {
                    logger.info("error");
                    logger.error(err);
                  });
              }
            })
            .catch((err) => {
              logger.info(err);
              logger.error(err);
            });
        } catch (err) {
          logger.info(err);
          logger.error(err);
        }
      });

      // const INACTIVITY_THRESHOLD = 5 * 60 * 1000; // 5 minutes

      //   setInterval(() => {
      //   const now = Date.now();
      //   for (const clientId in clientsActivity) {
      //     console.log(now - clientsActivity[clientId].lastActivity > INACTIVITY_THRESHOLD);
      //       if (now - clientsActivity[clientId].lastActivity > INACTIVITY_THRESHOLD) {
      //         console.log(`Client ${clientId} has been inactive for more than 5 minutes.`);
      //         // socketIo.close()
      //         // socket.disconnect(true);
      //         // Optionally, take action here, such as disconnecting the client or sending a notification
      //       }
      //   }
      //   },1000);
    
      client
        .initialize()
        .then((res) => {
          clientsActivity[socket.id].lastActivity = Date.now();
          // logger.info("res", res);
          logger.info("client initialized");
          // logger.info(" initialized client ");
        })
        .catch((err) => logger.error("error :", err));
  })

  const liveReloadServer = livereload.createServer()
  liveReloadServer.watch(path.join(__dirname, "static"))
  
  app.use(connectLivereload())
  
  liveReloadServer.server.once("connection", () => {
    setTimeout(() => {
      liveReloadServer.refresh("/")
    }, 100)
  })