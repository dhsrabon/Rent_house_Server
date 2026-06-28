const express = require("express");
const router = express.Router();
const {
  getAllProperties,
  getFeaturedProperties,
  addProperty,
  getMyProperties,
  getSingleProperty,
  updatePropertyStatus,
  deleteProperty,
  getAllPropertiesForAdmin
} = require("../controllers/propertyController");

// স্পেসিফিক রাউটগুলো আগে দিতে হবে
router.get("/all", getAllProperties); // আপনার ফ্রন্টএন্ড /all কল করছে, তাই এটি আগে থাকবে
router.get("/featured", getFeaturedProperties);
router.get("/admin/all", getAllPropertiesForAdmin);
router.get("/my/:ownerId", getMyProperties);

// রুট রাউট
router.get("/", getAllProperties); 
router.post("/add", addProperty);

// ডাইনামিক (/:id) রাউটগুলো সবসময় শেষে দিতে হবে
router.get("/:id", getSingleProperty); 
router.put("/update-status/:id", updatePropertyStatus);
router.delete("/delete/:id", deleteProperty);

module.exports = router;