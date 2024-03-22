const { Customers } = require("../models/customerModel");
const path = require("path")
const fs = require("fs")
const objectId = require("mongodb").ObjectId;
const logger = require("../logger");

//Add Customer
const addCustomer = async (req, res) => {
  const { from_date, to_date } = req.query;
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



module.exports = { addCustomer, getCustomers  };
