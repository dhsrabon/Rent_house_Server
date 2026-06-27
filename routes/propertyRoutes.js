const express = require("express");
const router = express.Router();
const controller = require("../controllers/propertyController");

// ১. স্পেশাল রাউটস সবার আগে
router.get("/admin/all", controller.getAllPropertiesForAdmin);
router.get("/featured", controller.getFeaturedProperties);

// ২. ডাটাবেসের অপারেশনস
router.post("/add", controller.addProperty);
router.put("/status/:id", controller.updatePropertyStatus);

// ৩. ডাইনামিক এবং পাবলিক রাউটস (এগুলো শেষে দিবেন)
router.get("/:id", controller.getSingleProperty); // আইডি এখানে ধরা পড়বে
router.get("/", controller.getAllProperties);     // সব প্রপার্টি দেখাবে

module.exports = router;