const { sign, verify } = require('jsonwebtoken');

function generateToken(data) {
  return sign(data, process.env.APP_SERVER_SECRET_KEY, { expiresIn: '120y' })
}

function decodeToken(token) {
  try {
    return verify(token, process.env.APP_SERVER_SECRET_KEY);
  } catch (e) {
    return null;
  }
}

exports.generateToken = generateToken;
exports.decodeToken = decodeToken;
