const { Customers } = require("../models/customerModel");
const path = require("path")
const fs = require("fs")
const objectId = require("mongodb").ObjectId;
const logger = require("../logger");

const customMessages = {
  "customer_name":"اسم العميل",
  "customer_mobile":"رقم الهاتف"
}
//Add Customer
const addCustomer = async (req, res) => {
  try {
    await Customers.create(req.body)
      .then((data) => {
        console.log(data);
        
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
          console.log(Object.keys(e.keyValue)[0]);
          errMsg = `${customMessages[Object.keys(e.keyValue)[0]]} مسجل من قبل ` ;
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
  const { customer_name, customer_mobile } =
  req.query;
let arr = [];
const matchData = () => {
  if (customer_name) {
    arr.push({
      customer_name: {
        $regex: customer_name, // Replace "your_search_term" with the actual term you're searching for
        $options: "i" // Case-insensitive search
      }
    });
  }
  if (customer_mobile) {
    arr.push({
      customer_mobile: {
        $regex: customer_mobile, // Replace "your_search_term" with the actual term you're searching for
        $options: "i" // Case-insensitive search
      }
    });
  }
    else if (!customer_mobile && !customer_name) arr.push({ });
  return arr;
};
console.log(...matchData());
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    await Customers.aggregate([
        {
        $sort: {
          created_at:-1 // Sort by createdAt in descending order
        }
     },
     {
      $match: {
        $and: [
         ...matchData()
        ]
      }
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
        res.status(200).send(data[0]);
      })
      .catch((e) => {
        res.status(400).json({ success: false, message: e.message });
      });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//All customers withot pagination 

const getAllCustomers = async (req, res) => {
  try {
    await Customers.find()
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



module.exports = { addCustomer, getCustomers , getAllCustomers };
