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

app.set("view engine", "ejs")
app.set("views", "views")
app.use(bodyparser.json())
app.use(cors())
app.use("/api",customerRoute);
app.use("/api",invitationRoute);
app.use("/api",inviteTransactionRoute);
app.use('/uploads', express.static('uploads'));
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
    mongoose.connect(url).then((clientdb)=>{
      // console.log(clientdb);
      console.log("connect to database");
      // clientdb.disconnect()
  
    })
  })

  socketIo.on("connection", async (socket) => {

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
        socket.emit("Authenticated", false);
        logger.info(socket.id);
        logger.info("qr:" + " " + qr);
        await socket.emit("loading", false);
        await socket.emit("QRCODE", qr);
      });
    
      client.on("loading_screen", () => {
        logger.info("loading screen");
        socket.emit("loading", true);
      });
    
      client.on("authenticated", async () => {
        logger.info("Successfully authenticated");
      });
    
      client.on("ready", async () => {
        logger.info("ready");
        socket.emit("isAuth", true);
        socket.emit("loading", false);
      });
    
      socket.on("Logout", async () => {
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
        logger.info("whatsappList =====>",data.whatsappList);
        for (let index = 0; index < data.whatsappList.length; index++) {
          const element = data.whatsappList[index];
          const chatId = element?.key + "@c.us";
          const message = element?.value;
          console.log("chatId ======>",chatId);
          console.log("message ======>",message);
          logger.info({ message: message, chatId: chatId });
          const pathOfImage = `./uploads/${element?.key}.png`
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
              logger.info(err);
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
                `./uploads/${element?.key}.png`
              );
             fs.unlinkSync(path1, (err) => {
                if (err) {
                   logger
                   .error(err);
                } else {
                   logger
                   .log("Delete File successfully.");
                }
               });
           await timer(1300);
            // return true;
          } 
          // else {
          //   socket.emit("error",`this invitation is already sent to ${element?.key}`)
          //   return false;
          // }
          }
    
        // }
      };
      socket.on("sendMediaToAll", (data) => {
        sendMediaToAll(data).then((res) => {
          console.log(res);
          socket.emit("success", "messages sent successfully ");
          // if (res) {
            
          // }
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
        logger.info("socket disconnected");
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
    
      client
        .initialize()
        .then((res) => {
          // logger.info("res", res);
          logger.info("client initialized");
          // logger.info(" initialized client ");
        })
        .catch((err) => logger.info("error :", err));
  })

  const liveReloadServer = livereload.createServer()
  liveReloadServer.watch(path.join(__dirname, "static"))
  
  app.use(connectLivereload())
  
  liveReloadServer.server.once("connection", () => {
    setTimeout(() => {
      liveReloadServer.refresh("/")
    }, 100)
  })