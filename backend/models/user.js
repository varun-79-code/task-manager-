const mongoose = require("mongoose");

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

  password: { 
    type: String, 
    required: true 
  },

  role: { 
    type: String, 
    enum: ["user", "admin"], 
    default: "user" 
  },

  // ✅ NEW FIELD — Roll Number
  rollNumber: {
    type: String,
    required: function () {
      return this.role === "user"; // only required for students
    },
    unique: true,
    sparse: true, // allows admin without roll number
    match: /^[0-9]{14}$/ // must be exactly 14 digits
  },

  // ✅ NEW FIELD — Link student to admin
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: function () {
      return this.role === "user";
    }
  }
});

module.exports = mongoose.model("User", userSchema);