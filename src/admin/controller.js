const jwt = require('jsonwebtoken');
const Sequelize = require('sequelize');
const DB = require('../database/dbUtils');
const { generateHash } = require('../utils');
const SequelizeObjects = require('../database/sequelize');
const Op = Sequelize.Op;
const { jwtsecret, jwtexpiration } = require('../../config');

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await DB.LoginPromise(SequelizeObjects, email, password, "admin");
        if (!result.result) return res.status(402).json(result.error);
        else {
            const user = result.user;
            const payload = {
                userId: user.id
            };

            jwt.sign(
                payload,
                jwtsecret,
                { expiresIn: jwtexpiration },
                async (err, token) => {
                    if (err) throw err;
                    res.json({ token, user: user });
                    return;
                }
            );
        }
    } catch (error) {
        console.log(error);
        return res.status(400).json('Interanal server error');
    }
}


const getAllUsers = async (req, res) => {
    try {

        const userId = req.userId;
        if (userId == 1) {
            const users = await SequelizeObjects.User.findAll({
                where: {
                    role_id: {
                        [Op.not]: 1
                    }
                },
                include: [{
                    model: SequelizeObjects.Role,
                    as: "role",
                    attributes: ['id', 'parent_id', 'label', 'fee', "type"]
                }]
            });
            return res.json(users);
        };

        const me = await DB.GetLoggedInUserStatisticsPromise(SequelizeObjects, userId);
        if (!me.result)
            return res.status(400).json('User not found');

        const users = await SequelizeObjects.User.findAll({
            where: {
                agent_code: me.id
            },
            include: [{
                model: SequelizeObjects.Role,
                as: "role",
                attributes: ['id', 'parent_id', 'label', 'fee', "type"]
            }]
        });
        return res.json(users);

    } catch (error) {
        console.log(error);
        return res.status(400).json('Interanal server error');
    }
}

const createUser = async (req, res) => {
    try {
        const row = req.body;
        const userId = req.userId;

        const me = await DB.GetLoggedInUserStatisticsPromise(SequelizeObjects, userId);
        if (!me.result)
            return res.status(400).json('User not found');

        if (me.role_id >= row.role_id)
            return res.status(400).json(`You can't access to this user`);
        await DB.CreateUserAccountPromise(SequelizeObjects, row);
        return res.json("success");

    } catch (error) {
        console.log(error);
        return res.status(400).json('Interanal server error');
    }
}

const updateUser = async (req, res) => {
    try {
        const row = req.body;
        const userId = req.userId;

        const me = await DB.GetLoggedInUserStatisticsPromise(SequelizeObjects, userId);
        if (!me.result)
            return res.status(400).json('User not found');

        const user = await SequelizeObjects.User.findAll({
            limit: 1,
            where: {
                id: row.id
            },
        });
        if (!user.length)
            return res.status(400).json('User not found');

        if (me.role_id >= user[0].role_id)
            return res.status(400).json(`You can't access to this user`);

        await user[0].update({ ...row, password: (me.role_id === 1 && row.password) ? generateHash(row.password) : user.password });

        return res.json("success");

    } catch (error) {
        console.log(error);
        return res.status(400).json('Interanal server error');
    }
}

const deleteUser = async (req, res) => {
    try {
        const { id } = req.body;
        const userId = req.userId;

        const me = await DB.GetLoggedInUserStatisticsPromise(SequelizeObjects, userId);
        if (!me.result)
            return res.status(400).json('User not found');

        const user = await SequelizeObjects.User.findAll({
            limit: 1,
            where: {
                id,
            },
        });
        if (!user.length)
            return res.status(400).json('User not found');

        if (me.role_id >= user[0].role_id)
            return res.status(400).json(`You can't access to this user`);

        await user[0].destroy();

        return res.json("success");

    } catch (error) {
        console.log(error);
        return res.status(400).json('Interanal server error');
    }
}

const getAllRoles = async (req, res) => {
    try {

        const userId = req.userId;

        const me = await DB.GetLoggedInUserStatisticsPromise(SequelizeObjects, userId);
        if (!me.result)
            return res.status(400).json('User not found');

        const roles = await SequelizeObjects.Role.findAll({
            where: {
                id: {
                    [Op.gt]: me.role_id
                }
            }
        });
        return res.json(roles);

    } catch (error) {
        console.log(error);
        return res.status(400).json('Interanal server error');
    }
}

const updateRole = async (req, res) => {
    try {
        const { id, label, fee } = req.body;
        const userId = req.userId;

        const me = await DB.GetLoggedInUserStatisticsPromise(SequelizeObjects, userId);
        if (!me.result)
            return res.status(400).json('User not found');

        if (me.role_id >= id)
            return res.status(400).json(`You can't access to this Role`);

        await SequelizeObjects.Role.update({ label, fee }, { where: { id } });

        return res.json("success");

    } catch (error) {
        console.log(error);
        return res.status(400).json('Interanal server error');
    }
}

const getAllCharging = async (req, res) => {
    try {

        const userId = req.userId;

        const me = await DB.GetLoggedInUserStatisticsPromise(SequelizeObjects, userId);
        if (!me.result)
            return res.status(400).json('User not found');

        if (userId === 1) {
            const result = await SequelizeObjects.Charge.findAll({
                include: [{
                    model: SequelizeObjects.User,
                    as: "user",
                    attributes: ['id', 'name', 'email', 'money', "role_id", "agent_code", "status"]
                }]
            });

            return res.json(result);
        }

        const users = await SequelizeObjects.User.findAll({
            where: {
                agent_code: me.id
            }
        });

        if (!users.length) return res.json([]);

        const userIds = users.map((user) => user.id);
        const result = await SequelizeObjects.Charge.findAll({
            where: {
                user_id: {
                    [Op.in]: userIds
                }
            },
            include: [{
                model: SequelizeObjects.User,
                as: "user",
                attributes: ['id', 'name', 'email', 'money', "role_id", "agent_code", "status"]
            }]
        });

        return res.json(result);

    } catch (error) {
        console.log(error);
        return res.status(400).json('Interanal server error');
    }
}


const approveCharging = async (req, res) => {
    try {

        const userId = req.userId;
        const { id } = req.body;

        const me = await DB.GetLoggedInUserStatisticsPromise(SequelizeObjects, userId);
        if (!me.result)
            return res.status(400).json('User not found');

        const charge = await SequelizeObjects.Charge.findAll({
            limit: 1,
            where: {
                id,
                status: false

            },
            include: [{
                model: SequelizeObjects.User,
                as: "user",
                attributes: ['id', 'name', 'email', 'money', "role_id", "agent_code", "status"]
            }]
        });

        if (!charge.length) return res.json([]);

        if (me.role_id >= charge[0].user.role_id)
            return res.status(400).json(`You can't access to this user`);

        await charge[0].update({ status: true });

        await SequelizeObjects.User.increment('money', {
            by: charge[0].amount,
            where: {
                id: charge[0].user_id
            },
        });

        return res.json("success");

    } catch (error) {
        console.log(error);
        return res.status(400).json('Interanal server error');
    }
}

const deleteCharging = async (req, res) => {
    try {

        const userId = req.userId;
        const { id } = req.body;

        const me = await DB.GetLoggedInUserStatisticsPromise(SequelizeObjects, userId);
        if (!me.result)
            return res.status(400).json('User not found');

        const charge = await SequelizeObjects.Charge.findAll({
            limit: 1,
            where: {
                id,
            },
            include: [{
                model: SequelizeObjects.User,
                as: "user",
                attributes: ['id', 'name', 'email', 'money', "role_id", "agent_code", "status"]
            }]
        });

        if (!charge.length) return res.json([]);

        if (me.role_id >= charge[0].user.role_id)
            return res.status(400).json(`You can't access to this user`);

        await charge[0].destroy();

        return res.json("success");

    } catch (error) {
        console.log(error);
        return res.status(400).json('Interanal server error');
    }
}


const getRecords = async (req, res) => {
    try {
        const userId = req.userId;

        const me = await DB.GetLoggedInUserStatisticsPromise(SequelizeObjects, userId);
        if (!me.result)
            return res.status(400).json('User not found');

        const records = await SequelizeObjects.Record.findAll({
            include: [{
                model: SequelizeObjects.User,
                as: "user",
                attributes: ['id', 'name', 'email', 'money', "role_id", "agent_code", "status"]
            }]
        });

        return res.json(records);

    } catch (error) {
        console.log(error);
        return res.status(400).json('Interanal server error');
    }
}

module.exports = {
    login,
    getAllUsers,
    createUser,
    updateUser,
    deleteUser,
    getAllRoles,
    updateRole,
    getAllCharging,
    approveCharging,
    deleteCharging,
    getRecords
}