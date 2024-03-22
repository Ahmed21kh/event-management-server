const { InviteTransactions } = require("../models/inviteTransactionModel");
const path = require("path")
const fs = require("fs")
const objectId = require("mongodb").ObjectId;
const QRCode = require('qrcode');
const { Customers } = require("../models/customerModel");
const { Invitations } = require("../models/invitationModel");
const logger = require("../logger");

//Add inviteTransaction
const addInviteTransaction = async (req, res) => {
  try {
    await InviteTransactions.create(req.body)
      .then(async(data) => {
        let customer =  await Customers.findOne({_id:new objectId(data.customer_id)})
        let invitation =  await Invitations.findOne({_id:new objectId(data.invitation_id)})

        let obj = {
            customer_name: customer.customer_name,
            customer_mobile: customer.customer_mobile,
            invitation_name: invitation.invite_name,
            from_date: invitation.from_date,
            to_date: invitation.to_date,
            invitation_desc: invitation.invite_desc,
            invite_transaction_id:data._id
        }
        // The data you want to encode in the QR code
        const qrData = JSON.stringify(obj);
         console.log( path.join(__dirname));
         console.log( path.join(__dirname,'../'));
        // The path where you want to save the QR code image
        const filePath = path.join(__dirname,`../uploads/${customer.customer_mobile}.png`) ;

       if (fs.existsSync(filePath)) {
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
        console.log(fs.existsSync(path.join(`/uploads/${customer.customer_mobile}.png`)));
       }
        // Generate the QR code and save it as a PNG image
       await res
          .status(200)
          .json({
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
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 5;
    await InviteTransactions.aggregate([
      {
        $match: {},
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
// update inviteTransaction
const updateInviteTransaction = async (req, res) => {
  try {
    await InviteTransactions.findOne({ _id: new objectId(req.query?.id) })
      .then((cust) => {
        logger.info("Customer: " + cust);
        if (cust.attendance_status === "attend") {
          res
            .status(200)
            .json({
              success: true,
              message:
                "this customer is already attend and this QR code is already scaned",
            });
        } else {
          InviteTransactions.findByIdAndUpdate(
            new objectId(req.query?.id),
            req.body,
            { new: true, upsert: false }
          )
            .then((data) => {
              res
                .status(200)
                .json({
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
module.exports = { addInviteTransaction, getInviteTransactions ,updateInviteTransaction };
