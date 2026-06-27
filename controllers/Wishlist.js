const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema({
  userId: { 
    type: String, 
    required: true // কোন ইউজার সেভ করছে
  },
  propertyId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Property", 
    required: true // কোন প্রপার্টি সেভ করছে
  }
}, { timestamps: true });

module.exports = mongoose.model("Wishlist", wishlistSchema);