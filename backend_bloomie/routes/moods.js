const express = require("express");
const prisma = require("../lib/prisma");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

router.use(requireAuth);

router.get("/today", async (req, res, next) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const mood = await prisma.mood.findFirst({
      where: { userId: req.userId, createdAt: { gte: startOfDay } },
      orderBy: { createdAt: "desc" },
    });

    res.json({ mood: mood?.mood || null });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { mood } = req.body;
    const validMoods = ["great", "good", "okay", "tired", "stressed"];

    if (!validMoods.includes(mood)) {
      return res.status(400).json({ error: "Invalid mood value" });
    }

    const entry = await prisma.mood.create({
      data: { mood, userId: req.userId },
    });

    res.status(201).json({ mood: entry });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
