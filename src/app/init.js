const dbUtils = require('../database/dbUtils');
const sequelizeObjects = require('../database/sequelize');

const ROLES = [{
    parent_id: 0,
    label: "Super Admin",
    fee: 0,
    type: "super_admin",
}, {
    parent_id: 1,
    label: "Company",
    fee: 0,
    type: "agent",
}, {
    parent_id: 1,
    label: "Sub Company",
    fee: 0,
    type: "agent",
}, {
    parent_id: 3,
    label: "Agent",
    fee: 0,
    type: "agent",
}, {
    parent_id: 4,
    label: "Sub Agent",
    fee: 0,
    type: "agent",
}, {
    parent_id: 5,
    label: "Player",
    fee: 0,
    type: "player",
}];

const ADMIN_USER = {
    name: "Admin",
    password: "123456",
    email: "admin@gmail.com",
    money: 1000,
    agent_code: 0,
    role_id: 1,
}

async function initBasicData() {
    try {
        for (const key in ROLES) {
            if (Object.hasOwnProperty.call(ROLES, key)) {
                const element = ROLES[key];
                await dbUtils.CreateRolePromise(sequelizeObjects, element);
            }
        }
        await dbUtils.CreateUserAccountPromise(sequelizeObjects, ADMIN_USER);
    } catch (error) {
        console.error(`Creating User Infor error: ${error}`);
    }
}

exports.initUser = initBasicData;
