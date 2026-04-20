const jwt = require("jsonwebtoken");

// DEV secret – for real app put in env
const JWT_SECRET = "super-secret-key";

function auth(requiredRole) {
  return (req, res, next) => {
    const token = req.header("Authorization");
    if (!token) {
      return res.status(401).json({ message: "No token, auth denied" });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      if (requiredRole && decoded.role !== requiredRole) {
        return res.status(403).json({ message: "Forbidden" });
      }
      next();
    } catch (err) {
      console.error("Auth error:", err.message);
      res.status(401).json({ message: "Token invalid" });
    }
  };
}

module.exports = auth;
module.exports.JWT_SECRET = JWT_SECRET;
