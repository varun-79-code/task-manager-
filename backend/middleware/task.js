const jwt = require('jsonwebtoken');
const JWT_SECRET = "mysecretkey123"; // Must be the same as in auth.js

module.exports = function(req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if not token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded.user; // Add the user ID to the request object
    next(); // Move on to the next function (the task route)
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};