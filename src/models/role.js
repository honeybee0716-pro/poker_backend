/**
 * User model for database
 * @param sequelize
 * @param type data types
 * @returns {*|void|target}
 */
module.exports = (sequelize, type) => {
    return sequelize.define('role', {
        id: {
            type: type.BIGINT,
            primaryKey: true,
            autoIncrement: true
        },
        parent_id: type.BIGINT,
        label: type.STRING,
        fee: type.NUMERIC,
        type: {
            type: type.ENUM('super_admin', 'agent', 'player'),
            allowNull: false,
        }
    });
};
