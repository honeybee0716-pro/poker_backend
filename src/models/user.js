const Role =
  /**
   * User model for database
   * @param sequelize
   * @param type data types
   * @returns {*|void|target}
   */
  (module.exports = (sequelize, type) => {
    return sequelize.define("user", {
      id: {
        type: type.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      name: type.STRING,
      email: type.STRING,
      password: type.STRING,
      xp: { type: type.INTEGER, defaultValue: 0 },
      money: { type: type.DOUBLE, defaultValue: 0 },
      win_count: { type: type.INTEGER, defaultValue: 0 },
      lose_count: { type: type.INTEGER, defaultValue: 0 },
      rew_ad_count: { type: type.INTEGER, defaultValue: 0 },
      status: { type: type.BOOLEAN, defaultValue: true },
      login_status: { type: type.BOOLEAN, defaultValue: false },
      agent_code: type.BIGINT,
      role_id: {
        type: type.BIGINT,
        references: {
          model: "roles",
          key: "id",
        },
      },
      player_role: { type: type.STRING, defaultValue: "" },
    });
  });
