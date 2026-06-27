const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Property = require("../models/Property");

const createBooking = async (req, res) => {
    try {
        const newBooking = new Booking(req.body);
        await newBooking.save();
        res.status(201).json({ success: true, message: "Booking requested!" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getOwnerBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ ownerId: req.params.ownerId }).populate("propertyId");
        res.status(200).json({ success: true, bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getTenantBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ tenantId: req.params.tenantId }).populate("propertyId");
        res.status(200).json({ success: true, bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateBookingStatus = async (req, res) => {
    try {
        await Booking.findByIdAndUpdate(req.params.id, { status: req.body.status });
        res.status(200).json({ success: true, message: "Status updated!" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getOwnerAnalytics = async (req, res) => {
    try {
        const { ownerId } = req.params;

        // ১. টোটাল প্রপার্টি
        const totalProperties = await Property.countDocuments({ ownerId });

        // ২. টোটাল বুকিং এবং আর্নিংস (শুধুমাত্র Approved)
        const bookings = await Booking.find({ ownerId, status: "Approved" }).populate("propertyId");
        
        const totalBookings = bookings.length;
        const totalEarnings = bookings.reduce((sum, b) => sum + (b.propertyId?.price || 0), 0);

        // ৩. গত ১২ মাসের আয়ের ক্যালকুলেশন
        const monthlyEarnings = Array(12).fill(0);
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        bookings.forEach(b => {
            const month = new Date(b.createdAt).getMonth();
            monthlyEarnings[month] += (b.propertyId?.price || 0);
        });

        const chartData = months.map((month, index) => ({
            name: month,
            earnings: monthlyEarnings[index]
        }));

        res.status(200).json({
            success: true,
            stats: { totalProperties, totalBookings, totalEarnings },
            chartData
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ১. অ্যাডমিনের জন্য সব বুকিং (সব প্রপার্টির)
const getAllBookingsAdmin = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("propertyId") // প্রপার্টির নাম পেতে
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ২. ট্রানজেকশন রিপোর্ট (যেগুলো পেইড)
const getAllTransactions = async (req, res) => {
  try {
    const transactions = await Booking.find({ status: { $in: ["Approved", "Paid"] } })
      .populate("propertyId"); 
    res.status(200).json({ success: true, transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ৩. পেমেন্ট স্ট্যাটাস আপডেট
const updatePaymentStatus = async (req, res) => {
  try {
    const { bookingId, transactionId } = req.body;

    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { 
        status: "Approved", 
        paymentStatus: "Paid",
        transactionId: transactionId 
      },
      { new: true }
    );

    if (!updatedBooking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    res.status(200).json({ success: true, message: "Payment successful and booking updated!", booking: updatedBooking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// সবগুলো ফাংশন একসাথে এক্সপোর্ট করা হলো
module.exports = {
  createBooking,
  getTenantBookings,
  getOwnerBookings,
  updateBookingStatus,
  getOwnerAnalytics,
  updatePaymentStatus,
  getAllBookingsAdmin, 
  getAllTransactions
};