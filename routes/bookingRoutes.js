const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

// আপাতত কমেন্ট করে রাখুন
// router.get('/admin/all-bookings', bookingController.getAllBookingsAdmin);
// router.get('/admin/transactions', bookingController.getAllTransactions);

// Booking Routes
router.post('/request', bookingController.createBooking); 
router.get('/my-bookings/:tenantId', bookingController.getTenantBookings);
router.get('/owner-requests/:ownerId', bookingController.getOwnerBookings);
router.put('/update-status/:id', bookingController.updateBookingStatus);

router.get('/owner-analytics/:ownerId', bookingController.getOwnerAnalytics);

// 🔴 পেমেন্ট আপডেটের রাউটটি এখানে (exports এর আগে) যোগ করা হয়েছে
router.patch('/update-payment', bookingController.updatePaymentStatus);

// module.exports সবসময় ফাইলের একদম শেষে থাকতে হবে
module.exports = router;
// ইউজারের বুকিং স্ট্যাটাস চেক করার API
router.get('/check/:propertyId/:tenantId', async (req, res) => {
  try {
    const { propertyId, tenantId } = req.params;
    
    // ডাটাবেসে খুঁজুন এই ইউজারের এই প্রপার্টিতে কোনো বুকিং আছে কি না
    const booking = await Booking.findOne({ propertyId, tenantId });
    
    if (booking) {
      res.status(200).json({ success: true, booking });
    } else {
      res.status(200).json({ success: false, message: "No booking found" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});