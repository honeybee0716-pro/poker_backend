const { Router } = require('express');
const auth = require('./middleware/auth');
const { V, validator } = require('./middleware/validation');
const {
    login,
    getAllUsers,
    getAllRoles,
    updateUser,
    deleteUser,
    createUser,
    updateRole,
    getAllCharging,
    approveCharging,
    deleteCharging,
    getRecords
} = require('./controller');

const router = Router();

router.post("/login", V.body(validator.auth.login), login);

router.route("/users").get(auth, getAllUsers)
    .post(auth, V.body(validator.user.create), createUser)
    .put(auth, V.body(validator.user.update), updateUser);

router.post("/user/delete", auth, V.body(validator.id), deleteUser);

router.route("/roles")
    .get(auth, getAllRoles)
    .post(auth, V.body(validator.role.create), updateRole);


router.route("/charging")
    .get(auth, getAllCharging)
    .post(auth, V.body(validator.id), approveCharging)
    .put(auth, V.body(validator.id), deleteCharging);

router.get("/records", auth, getRecords);

module.exports = router;

