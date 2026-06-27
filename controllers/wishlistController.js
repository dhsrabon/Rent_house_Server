const Wishlist = require("../models/Wishlist");

// উইশলিস্টে যোগ বা বাদ দেওয়া (Toggle)
const toggleWishlist = async (req, res) => {
  try {
    const { userId, propertyId } = req.body;

    // চেক করা হচ্ছে প্রপার্টিটি আগে থেকেই উইশলিস্টে আছে কি না
    const existing = await Wishlist.findOne({ userId, propertyId });
    
    if (existing) {
      await Wishlist.findByIdAndDelete(existing._id);
      return res.status(200).json({ success: true, message: "Removed from wishlist", action: "removed" });
    }

    const newWishlist = new Wishlist({ userId, propertyId });
    await newWishlist.save();
    res.status(201).json({ success: true, message: "Added to wishlist", action: "added" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ইউজারের সব উইশলিস্ট আইটেম দেখা
const getMyWishlist = async (req, res) => {
  try {
    const { userId } = req.params;
    const wishlist = await Wishlist.find({ userId }).populate("propertyId");
    res.status(200).json({ success: true, wishlist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ড্যাশবোর্ড থেকে ডিলিট করা
const removeFromWishlist = async (req, res) => {
  try {
    const { id } = req.params;
    await Wishlist.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Item removed successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { toggleWishlist, getMyWishlist, removeFromWishlist };