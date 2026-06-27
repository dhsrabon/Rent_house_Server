const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET || process.env.BETTER_AUTH_SECRET;
  return jwt.sign({ id: userId }, secret, {
    expiresIn: '7d',
  });
};

module.exports = generateToken;
