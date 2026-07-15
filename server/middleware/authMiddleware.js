const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: 'No session token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecret_retrocabinet_key_1337');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Session token is not valid' });
  }
};

module.exports = authMiddleware;
