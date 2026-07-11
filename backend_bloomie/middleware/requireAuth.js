const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId; // attach user id so every route below can use it
    next(); // move on to the actual route
  } catch {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
}

module.exports = requireAuth;