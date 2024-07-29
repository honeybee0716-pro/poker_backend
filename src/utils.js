const fs = require('fs');
const config = require('../config');
const dotEnv = require('dotenv');
const bcrypt = require('bcrypt-nodejs');
dotEnv.config();


/**
 * Get web socket server options
 * @returns {{secure: boolean, key: null, cert: null, ca: null}}
 * @constructor
 */
exports.GetCertOptions = function () {
  if (!config.server.secure) {
    return {
      secure: false,
    };
  } else {
    return {
      secure: true,
      key: fs.readFileSync(process.env.HTTPS_KEY),
      cert: fs.readFileSync(process.env.HTTPS_CERT),
      ca: fs.readFileSync(process.env.HTTPS_CA)
    };
  }
};

exports.generateHash = (password) => {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
};

exports.validPassword = (password, encrypted) => {
  return bcrypt.compareSync(password, encrypted);
};