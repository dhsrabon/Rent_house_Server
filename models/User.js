const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  photoURL: { 
    type: String, 
    required: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    default: 'tenant', 
    enum: ['tenant', 'owner', 'admin'] // এই ৩টি রোলের বাইরে কিছু হতে পারবে না
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);