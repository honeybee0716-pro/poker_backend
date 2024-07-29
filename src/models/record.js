/**
 * User model for database
 * @param sequelize
 * @param type data types
 * @returns {*|void|target}
 */
module.exports = (sequelize, type) => {
  return sequelize.define('record', {
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
    current_money: type.NUMERIC,
    player_cards: type.STRING,
    action: type.STRING,
    amount: { type: type.BIGINT, defaultValue: 0 },
  })
};
