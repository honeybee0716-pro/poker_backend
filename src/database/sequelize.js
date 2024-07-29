// Components
const config = require('../../config');
const Sequelize = require('sequelize');
const dotEnv = require('dotenv');
dotEnv.config();

// Models
const UserModel = require('../models/user');
const RoleModel = require('../models/role');
const ChargeModel = require('../models/charge');
const RecordModel = require('../models/record');
const StatisticModel = require('../models/statistic');


// Sequelize instance
const sequelize = new Sequelize(process.env.DB_DATABASE, process.env.DB_USER, process.env.DB_PASSWORD, {
  port: process.env.DB_PORT,
  host: process.env.DB_HOST,
  dialect: process.env.DB_DIALECT,
  pool: {
    max: 10,
    min: 0,
    idle: 10000
  },
  logging: function (str) {
    if (config.sequelize.logging) {
      console.log(str);
    }
  },
});


// Initialize models
const User = UserModel(sequelize, Sequelize);
const Role = RoleModel(sequelize, Sequelize);
const Record = RecordModel(sequelize, Sequelize);
const Charge = ChargeModel(sequelize, Sequelize);
const Statistic = StatisticModel(sequelize, Sequelize);


// Define relations
User.hasMany(Statistic);
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' }); 
Charge.belongsTo(User, { foreignKey: 'user_id', as: 'user' }); 
Record.belongsTo(User, { foreignKey: 'user_id', as: 'user' }); 

// Sync with database
sequelize.sync(/*{force: true}*/) // Do not use force, will drop table
  .then(() => {
  });


// Export models
module.exports = {
  User,
  Role,
  Record,
  Charge,
  Statistic,
};
