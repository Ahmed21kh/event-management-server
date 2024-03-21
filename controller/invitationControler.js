const { Invitations } = require("../models/invitationModel");

const objectId = require("mongodb").ObjectId;

//Add Invitation
const addInvitation = async(req, res)=>{
try {
    await Invitations.create( req.body ).then((data)=>{
    res.status(200).json({ success: true, message: "Invitation created successfully",data });
    }).catch((e)=>{
        res.status(400).json({success: false, message: e.message})
    })
        
    } catch (error) {
     res.status(500).json({ success: false, message: error.message });
    }
}

//Get Invitation 
const getInvitations = async(req, res)=>{
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 5;
        await Invitations.aggregate([
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
          ]).then((data)=>{
        res.status(200).send(data);
        }).catch((e)=>{
            res.status(400).json({success: false, message: e.message})
        })
            
        } catch (error) {
         res.status(500).json({ success: false, message: error.message });
        }
    }
module.exports = {addInvitation,getInvitations}