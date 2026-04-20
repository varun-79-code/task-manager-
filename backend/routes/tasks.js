const express = require("express");
const mongoose = require("mongoose");
const Task = require("../models/task");
const auth = require("../middleware/auth");

const router = express.Router();

// ADMIN: create task (multi assignees)
router.post("/create", auth("admin"), async (req, res) => {
  try {
    const { title, description, assignedTo, deadline } = req.body;

    if (!title || !Array.isArray(assignedTo) || assignedTo.length === 0) {
      return res
        .status(400)
        .json({ message: "Title and at least one assignee required" });
    }

    const validIds = assignedTo.filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length !== assignedTo.length) {
      return res.status(400).json({ message: "Invalid assignee ID(s)" });
    }

    let deadlineDate = null;
    if (deadline) {
      const d = new Date(deadline);
      if (!isNaN(d.getTime())) deadlineDate = d;
    }

    const task = new Task({
      title,
      description,
      assignedTo: validIds,
      assignedBy: req.user.id,
      deadline: deadlineDate
    });

    await task.save();

    const populated = await Task.findById(task._id)
      .populate("assignedTo", "name email")
      .populate("assignedBy", "name email");

    res.status(201).json({ message: "Task created", task: populated });
  } catch (err) {
    console.error("Create task error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ADMIN: all tasks
router.get("/all", auth("admin"), async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate("assignedTo", "name email")
      .populate("assignedBy", "name email")
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    console.error("All tasks error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// USER: my tasks
router.get("/mytasks", auth(), async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user.id }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    console.error("My tasks error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// USER: update own task
router.post("/update", auth(), async (req, res) => {
  try {
    const { taskId, remark, status } = req.body;
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const myId = req.user.id;
    if (!task.assignedTo.map((x) => x.toString()).includes(myId)) {
      return res.status(403).json({ message: "Not your task" });
    }

    if (typeof remark === "string") task.remark = remark;
    const allowed = ["pending", "completed", "delayed"];
    if (status && allowed.includes(status)) task.status = status;

    await task.save();
    res.json({ message: "Task updated", task });
  } catch (err) {
    console.error("Update task error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ADMIN: update task
router.post("/admin-update", auth("admin"), async (req, res) => {
  try {
    const { taskId, title, description, assignedTo, status, deadline } = req.body;
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (title) task.title = title;
    if (typeof description === "string") task.description = description;

    if (Array.isArray(assignedTo) && assignedTo.length > 0) {
      const validIds = assignedTo.filter((id) => mongoose.Types.ObjectId.isValid(id));
      if (validIds.length !== assignedTo.length) {
        return res.status(400).json({ message: "Invalid assignee ID(s)" });
      }
      task.assignedTo = validIds;
    }

    const allowed = ["pending", "completed", "delayed"];
    if (status && allowed.includes(status)) task.status = status;

    if (deadline) {
      const d = new Date(deadline);
      if (!isNaN(d.getTime())) task.deadline = d;
    }

    await task.save();

    const populated = await Task.findById(task._id)
      .populate("assignedTo", "name email")
      .populate("assignedBy", "name email");

    res.json({ message: "Task updated", task: populated });
  } catch (err) {
    console.error("Admin update task error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ADMIN: delete task
router.delete("/delete/:id", auth("admin"), async (req, res) => {
  try {
    await Task.deleteOne({ _id: req.params.id });
    res.json({ message: "Task deleted" });
  } catch (err) {
    console.error("Delete task error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
