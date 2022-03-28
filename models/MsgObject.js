const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Msg = new Schema({
    ownerId:
    {
        type:String, 
        min: 1, 
        max: 2000,
    },
    message:
    {
        type:String, 
        min: 1, 
        max: 2000,
    },
    upvotes:
    {
        type:Number, 
        min: 0,
        default: 0
    },
    downvotes:
    {
        type:Number, 
        min: 0,
        default: 0
    },
    likedIds:
    {
        type:String,
        default:"[]",
    },
    dislikedIds:
    {
        type:String,
        default:"[]",
    },
    date: {
        type:Date,
        default:Date.now
    }
}, {collection: "messages"})

module.exports = mongoose.model("Messages",Msg);
