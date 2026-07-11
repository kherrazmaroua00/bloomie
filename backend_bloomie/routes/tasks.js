const express = require("express");
const prisma = require("../lib/prisma");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

router.use(requireAuth);

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

router.get("/", async (req, res, next) => {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        userId: req.userId,
        createdAt: { gte: startOfToday() },
      },
      orderBy: { createdAt: "asc" },
    });
    res.json({ tasks });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { title } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }

    const task = await prisma.task.create({
      data: { title: title.trim(), userId: req.userId },
    });
    res.status(201).json({ task });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task || task.userId !== req.userId) {
      return res.status(404).json({ error: "Task not found" });
    }

    const updated = await prisma.task.update({
      where: { id },
      data: { completed: !task.completed },
    });
    res.json({ task: updated });
  } catch (err) {
    next(err);
  }
});

// GET all tasks ever (for the "view all" page), grouped conceptually by date
router.get("/all", async (req, res, next) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "desc" },
    });
    res.json({ tasks });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task || task.userId !== req.userId) {
      return res.status(404).json({ error: "Task not found" });
    }

    await prisma.task.delete({ where: { id } });
    res.json({ message: "Task deleted" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
