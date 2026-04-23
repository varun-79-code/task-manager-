const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const auth = require("../middleware/auth");
const { JWT_SECRET } = require("../middleware/auth");

const router = express.Router();

/* =========================
   REGISTER (STUDENT)
========================= */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, rollNumber, adminId } = req.body;

    if (!name || !email || !password || !rollNumber || !adminId)
      return res.status(400).json({ message: "All fields required" });

    // roll number validation (14 digits)
    if (!/^[0-9]{14}$/.test(rollNumber))
      return res.status(400).json({ message: "Roll number must be 14 digits" });

    const existing = await User.findOne({
      $or: [{ email }, { rollNumber }]
    });

    if (existing)
      return res.status(400).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashed,
      role: "user",
      rollNumber,
      adminId
    });

    await user.save();

    res.status(201).json({ message: "Registered successfully" });

  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   LOGIN
========================= */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid email or password" });

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, role: user.role });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   GET ADMINS (for register dropdown)
========================= */
router.get("/admins", async (req, res) => {
  try {
    const admins = await User.find({ role: "admin" })
      .select("_id name email")
      .sort({ name: 1 });

    res.json(admins);
  } catch (err) {
    console.error("Admins fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   LIST USERS (ADMIN ONLY – their students)
========================= */
router.get("/users", auth("admin"), async (req, res) => {
  try {
    const users = await User.find({ adminId: req.user.id })
      .select("-password")
      .sort({ name: 1 });

    res.json(users);
  } catch (err) {
    console.error("Users list error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   MAKE ADMIN
========================= */
router.post("/make-admin", auth("admin"), async (req, res) => {
  try {
    const { id } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      { $set: { role: "admin" } },
      { new: true }
    );

    if (!user)
      return res.status(404).json({ message: "User not found" });

    res.json({ message: "Role updated", user });

  } catch (err) {
    console.error("Make admin error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   EDIT USER
========================= */
router.put("/users/:id", auth("admin"), async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const update = {};

    if (name) update.name = name;
    if (email) update.email = email;

    if (password && password.trim()) {
      update.password = await bcrypt.hash(password, 10);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true, select: "-password" }
    );

    if (!user)
      return res.status(404).json({ message: "User not found" });

    res.json({ message: "User updated", user });

  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;