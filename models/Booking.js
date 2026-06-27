const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  propertyId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Property', 
    required: true 
  },
  tenantId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', // ইউজারের কালেকশনের নাম
    required: true 
  },
  ownerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  moveInDate: { 
    type: String, 
    required: true 
  },
  contactNumber: { 
    type: String, 
    required: true 
  },
  notes: { 
    type: String 
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending' // রিকোয়ারমেন্ট অনুযায়ী ডিফল্ট স্ট্যাটাস pending থাকবে
  }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);