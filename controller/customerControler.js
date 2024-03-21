const { Customers } = require("../models/customerModel");
const path = require("path")
const fs = require("fs")
const objectId = require("mongodb").ObjectId;
const QRCode = require('qrcode');
const logger = require("../logger");

//Add Customer
const addCustomer = async (req, res) => {
  const { from_date, to_date } = req.query;
  try {
    await Customers.create(req.body)
      .then((data) => {
        console.log(data);
        // The data you want to encode in the QR code
        const qrData = JSON.stringify({from_date,to_date,customer_name:data.customer_name,customer_mobile:data.customer_mobile,_id:data._id,invitation:data.invitation});

        // The path where you want to save the QR code image
        const filePath = path.join(__dirname,`../uploads/${data.customer_mobile}.png`) ;

        // Generate the QR code and save it as a PNG image
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
        res
          .status(200)
          .json({
            success: true,
            message: "Customer created successfully",
            data,
          });
      })
      .catch((e) => {
        let errMsg;
        if (e.code == 11000) {
          errMsg = Object.keys(e.keyValue)[0] + " already exists.";
        } else {
          errMsg = e.message;
        }
        res.status(400).json({ success: false, message:errMsg });
      });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//Get Customers
const getCustomers = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 5;
    await Customers.aggregate([
      {
        $match: {},
      },
      {
        $lookup: {
          from: "invitations", // Name of the other collection
          localField: "invitation", // Field from the attendance documents
          foreignField: "_id", // Field from the students documents
          as: "inviteDetails", // Output array field
        },
      },
      {
        $unwind: {
          path: "$inviteDetails", // Unwind the inviteDetails array
          preserveNullAndEmptyArrays: false, // Optional: Exclude documents without a match
        },
      },
      {
        $addFields: {
          inviteDetails: "$inviteDetails", // Move studentDetails back to top level
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

//Update Customer
const updateCustomer = async (req,res) =>{
  try {
   await Customers.findOne({_id:new objectId(req.query?.id)}).then((cust)=>{
     logger.info("Customer: " + cust)
     if (cust.isAttend) {
      res.status(200).json({ success: true, message: "this customer is already attend and this QR code is already scaned" });
     }else {
        Customers.findByIdAndUpdate(new objectId(req.query?.id), req.body,{ new: true, upsert: false }).then((data)=>{
        res.status(200).json({ success: true, data,message:"QR code scaned successfully and the customer is attend" });
       }).catch((e)=>{
        res.status(400).json({ success: false, message: e.message });
       })

     }
   }).catch((err)=>{
    res.status(400).json({ success: false, message: e.message });
   })

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
    
  }
}
module.exports = { addCustomer, getCustomers , updateCustomer };
