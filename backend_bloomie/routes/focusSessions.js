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

// GET today's stats: session count + total minutes
router.get("/today", async (req, res, next) => {
  try {
    const sessions = await prisma.focusSession.findMany({
      where: {
        userId: req.userId,
        completedAt: { gte: startOfToday() },
      },
      orderBy: { completedAt: "asc" },
    });

    const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0);

    res.json({
      sessionsCount: sessions.length,
      totalMinutes,
      sessions,
    });
  } catch (err) {
    next(err);
  }
});

// CREATE — logs one completed focus session
router.post("/", async (req, res, next) => {
  try {
    const { duration } = req.body;

    if (!duration || duration <= 0) {
      return res.status(400).json({ error: "Valid duration is required" });
    }

    const session = await prisma.focusSession.create({
      data: { duration, userId: req.userId },
    });

    res.status(201).json({ session });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
