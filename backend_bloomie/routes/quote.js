const express = require("express");
const router = express.Router();

router.get("/today", async (req, res, next) => {
  try {
    const response = await fetch("https://zenquotes.io/api/today");
    const data = await response.json();

    const quote = data[0]?.q;
    const author = data[0]?.a;

    if (!quote) {
      throw new Error("No quote returned from API");
    }

    res.json({ quote, author });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
