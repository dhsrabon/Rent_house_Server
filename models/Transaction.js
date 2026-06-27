const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  bookingId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Booking', 
    required: true 
  },
  transactionId: { 
    type: String, 
    required: true, 
    unique: true // একই পেমেন্ট যেন দুইবার সেভ না হয়
  },
  amount: { 
    type: Number, 
    required: true 
  },
  tenantId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  date: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);