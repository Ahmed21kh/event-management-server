const { InviteTransactions } = require("../models/inviteTransactionModel");
const path = require("path");
const fs = require("fs");
const objectId = require("mongodb").ObjectId;
const QRCode = require("qrcode");
const { Customers } = require("../models/customerModel");
const { Invitations } = require("../models/invitationModel");
const logger = require("../logger");

//Add inviteTransaction
const addInviteTransaction = async (req, res) => {
  try {
    await InviteTransactions.create(req.body)
      .then(async (data) => {
        let customer = await Customers.findOne({
          _id: new objectId(data.customer_id),
        });
        let invitation = await Invitations.findOne({
          _id: new objectId(data.invitation_id),
        });

        let obj = {
          customer_name: customer.customer_name,
          customer_mobile: customer.customer_mobile,
          invitation_name: invitation.invite_name,
          from_date: invitation.from_date,
          to_date: invitation.to_date,
          invitation_desc: invitation.invite_desc,
          invite_transaction_id: data._id,
        };
        // The data you want to encode in the QR code
        const qrData = JSON.stringify(obj);
        console.log(path.join(__dirname));
        console.log(path.join(__dirname, "../"));
        // The path where you want to save the QR code image
        const filePath = path.join(
          __dirname,
          `../uploads/${customer.customer_mobile}.png`
        );
        const folderPath = path.join(__dirname, `../uploads`);

        if (fs.existsSync(folderPath)) {
          QRCode.toFile(
            filePath,
            qrData,
            {
              errorCorrectionLevel: "H", // High error correction level
            },
            function (err) {
              if (err) throw err;
              console.log("QR code saved to", filePath);
            }
          );
        } else {
          console.log("filePath not found");
          console.log(
            fs.existsSync(
              path.join(`./uploads/${customer.customer_mobile}.png`)
            )
          );
        }
        // Generate the QR code and save it as a PNG image
        await res.status(200).json({
          success: true,
          message: "InviteTransaction created successfully",
          data,
        });
      })
      .catch((e) => {
        res.status(400).json({ success: false, message: e.message });
      });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//Get inviteTransaction
const getInviteTransactions = async (req, res) => {
  const { customer_name, customer_mobile, invite_name, sending_status } =
    req.query;
  let arr = [];
  const matchData = () => {
    if (customer_name) {
      arr.push({
        $match: {
          '$expr': {
            '$regexMatch': {
              'input': '$customerDetails.customer_name',
              'regex': customer_name,
              'options': 'i'
            }
          }
        },
      });
    }
    if (customer_mobile) {
      arr.push({
        $match: {
        '$expr': {
          '$regexMatch': {
            'input': '$customerDetails.customer_mobile',
            'regex': customer_mobile,
            'options': 'i'
          }
        }
        },
      });
    }
    if (invite_name) {
      arr.push({
        $match: {       
          '$expr': {
          '$regexMatch': {
            'input': '$inviteDetails.invite_name',
            'regex': invite_name,
            'options': 'i'
          }
        }
      },
      });
    }
    if (sending_status) {
      arr.push({ $match: {  sending_status: sending_status  } });
    } else if (!req.query) arr.push({ $match: {} });
    return arr;
  };
  console.log(...matchData());
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 5;
    await InviteTransactions.aggregate([
      {
        $sort: {
          created_at:-1 // Sort by createdAt in descending order
        }
     },
      {
        $lookup: {
          from: "invitations", // Name of the other collection
          localField: "invitation_id", // Field from the attendance documents
          foreignField: "_id", // Field from the students documents
          as: "inviteDetails", // Output array field
        },
      },
      {
        $lookup: {
          from: "customers", // Name of the other collection
          localField: "customer_id", // Field from the attendance documents
          foreignField: "_id", // Field from the students documents
          as: "customerDetails", // Output array field
        },
      },
      {
        $unwind: {
          path: "$inviteDetails", // Unwind the inviteDetails array
          preserveNullAndEmptyArrays: false, // Optional: Exclude documents without a match
        },
      },
      {
        $unwind: {
          path: "$customerDetails", // Unwind the customerDetails array
          preserveNullAndEmptyArrays: false, // Optional: Exclude documents without a match
        },
      },
      {
        $addFields: {
          inviteDetails: "$inviteDetails", // Move inviteDetails back to top level
          customerDetails: "$customerDetails", // Move customerDetails back to top level
        },
      },
      ...matchData(),
      {
        $facet: {
          metaData: [
            {
              $count: "total",
            },
            {
              $addFields: {
                pageNumber: Number(page),
                totalPages: { $ceil: { $divide: ["$total", limit] } },
              },
            },
          ],
          data: [
            {
              $skip: Number((page - 1) * limit),
            },
            {
              $limit: Number(limit),
            },
          ],
        },
      },
    ])
      .then((data) => {
        res.status(200).send(data);
      })
      .catch((e) => {
        res.status(400).json({ success: false, message: e.message });
      });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// //Get inviteTransaction
// const getInviteTransactions = async (req, res) => {
//   const { customer_name, customer_mobile, invite_name, sending_status } =
//       req.query;
//   const options = {
//       customer_name: "customerDetails.customer_name",
//       customer_mobile: "customerDetails.customer_mobile",
//       invite_name: "inviteDetails.invite_name",
//   };
//   const match = {
//       $match: {},
//   };
//   if (sending_status) {
//       match.$match.sending_status = sending_status;
//   } else if (req.query) {
//       for (const key in req.query) {
//           if (key in options) {
//               match.$match[options[key]] = {
//                   $regex: req.query[key],
//                   $options: "i",
//               };
//           }
//       }
//   }
//   const pipeline = [
//       {
//           $lookup: {
//               from: "invitations",
//               localField: "invitation_id",
//               foreignField: "_id",
//               as: "inviteDetails",
//           },
//       },
//       {
//           $lookup: {
//               from: "customers",
//               localField: "customer_id",
//               foreignField: "_id",
//               as: "customerDetails",
//           },
//       },
//       {
//           $unwind: {
//               path: "$inviteDetails",
//               preserveNullAndEmptyArrays: false,
//           },
//       },
//       {
//           $unwind: {
//               path: "$customerDetails",
//               preserveNullAndEmptyArrays: false,
//           },
//       },
//       match,
//       {
//           $facet: {
//               metaData: [
//                   {
//                       $count: "total",
//                   },
//                   {
//                       $addFields: {
//                           pageNumber: Number(req.query.page || 1),
//                           totalPages: { $ceil: { $divide: ["$total", Number(req.query.limit || 5)] } },
//                       },
//                   },
//               ],
//               data: [
//                   {
//                       $skip: Number((req.query.page - 1) * req.query.limit) || 0,
//                   },
//                   {
//                       $limit: Number(req.query.limit) || 5,
//                   },
//               ],
//           },
//       },
//   ];
//   try {
//       const data = await InviteTransactions.aggregate(pipeline);
//       res.status(200).send(data);
//   } catch (error) {
//       res.status(500).json({ success: false, message: error.message });
//     }
// };


// Function to check if an invitation has expired
function isInvitationExpired(invitation) {
  const currentDate = new Date();
  const expirationDate = new Date(invitation);
  logger.info(
    `currentDate > expirationDate =>>>  ${currentDate > expirationDate}`
  );
  // Check if the current date is after the expiration date
  return currentDate > expirationDate;
}
// update inviteTransaction
const updateInviteTransaction = async (req, res) => {
  try {
    await InviteTransactions.findOne({ _id: new objectId(req.query?.id) })
      .then((cust) => {
        logger.info("Customer: " + cust);
        if (cust.attendance_status === "attend") {
          res.status(200).json({
            success: true,
            message: " this QR code is already scaned",
          });
        } else if (isInvitationExpired(req.query.to_date)) {
          res.status(200).json({
            success: true,
            message: " this  QR code has expired",
          });
        } else {
          InviteTransactions.findByIdAndUpdate(
            new objectId(req.query?.id),
            req.body,
            { new: true, upsert: false }
          )
            .then((data) => {
              res.status(200).json({
                success: true,
                data,
                message:
                  "QR code scaned successfully and the customer is attend",
              });
            })
            .catch((e) => {
              res.status(400).json({ success: false, message: e.message });
            });
        }
      })
      .catch((err) => {
        res.status(400).json({ success: false, message: err.message });
      });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
module.exports = {
  addInviteTransaction,
  getInviteTransactions,
  updateInviteTransaction,
};
