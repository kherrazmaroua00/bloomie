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

function isFromToday(date) {
  return new Date(date) >= startOfToday();
}

router.get("/", async (req, res, next) => {
  try {
    const entries = await prisma.diaryEntry.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "desc" },
    });
    res.json({ entries });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Entry cannot be empty" });
    }

    // Pull today's mood so the entry is saved together with it
    const todaysMood = await prisma.mood.findFirst({
      where: { userId: req.userId, createdAt: { gte: startOfToday() } },
      orderBy: { createdAt: "desc" },
    });

    const entry = await prisma.diaryEntry.create({
      data: {
        content,
        mood: todaysMood?.mood || null,
        userId: req.userId,
      },
    });
    res.status(201).json({ entry });
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const entry = await prisma.diaryEntry.findUnique({ where: { id } });
    if (!entry || entry.userId !== req.userId) {
      return res.status(404).json({ error: "Entry not found" });
    }

    if (!isFromToday(entry.createdAt)) {
      return res.status(403).json({ error: "Only today's entry can be edited" });
    }

    const updated = await prisma.diaryEntry.update({
      where: { id },
      data: { content },
    });
    res.json({ entry: updated });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const entry = await prisma.diaryEntry.findUnique({ where: { id } });
    if (!entry || entry.userId !== req.userId) {
      return res.status(404).json({ error: "Entry not found" });
    }

    if (!isFromToday(entry.createdAt)) {
      return res.status(403).json({ error: "Only today's entry can be deleted" });
    }

    await prisma.diaryEntry.delete({ where: { id } });
    res.json({ message: "Entry deleted" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
