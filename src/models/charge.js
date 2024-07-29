/**
 * User model for database
 * @param sequelize
 * @param type data types
 * @returns {*|void|target}
 */
module.exports = (sequelize, type) => {
    return sequelize.define('charge', {
      id: {
        type: type.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: type.BIGINT,
        references: {
          model: 'users', // refers to table name
          key: 'id', // refers to column name in model value table
        }
      },
      amount: type.NUMERIC,
      status: { type: type.BOOLEAN, defaultValue: false },
    })
  };
  