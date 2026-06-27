const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  location: { type: String, required: true },
  type: { type: String, required: true },
  price: { type: Number, required: true },
  status: { type: String, default: "Pending" },
  isFeatured: { type: Boolean, default: false },
  ownerId: { type: String, required: true },
  rejectionFeedback: { type: String, default: "" },
  images: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model("Property", propertySchema);