const HttpStatusCodes = require('http-status-codes');
const jwt = require('jsonwebtoken');
const { jwtsecret } = require('../../../config');

module.exports = function (
    req,
    res,
    next
) {
    // Get token from header
    const token = req.header('x-auth-token');

    // Check if no token
    if (!token) {
        res
            .status(HttpStatusCodes.UNAUTHORIZED)
            .json({ msg: 'No token, authorization denied' });
        return;
    }
    // Verify token
    try {
        const payload = jwt.verify(token, jwtsecret);
        req.userId = payload.userId;
        next();
    } catch (err) {
        res
            .status(HttpStatusCodes.UNAUTHORIZED)
            .json({ msg: 'Token is not valid' });
    }
}
