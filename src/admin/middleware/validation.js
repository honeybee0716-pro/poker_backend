const Joi = require('joi');
const Validation = require('express-joi-validation');

const V = Validation.createValidator({ passError: true });

const retrunValidation = (
    error,
    req,
    res,
    next
) => {
    if (error && error.error && error.value && error.type) {
        res.status(400).json(error.error.toString().replace('Error: ', ''));
        return;
    } else {
        next(error);
        return;
    }
};

const validator = {
    id: Joi.object({
        id: Joi.number().min(0).required()
    }),
    auth: {
        login: Joi.object({
            email: Joi.string().required(),
            password: Joi.string().required()
        }),
    },
    user: {
        create: Joi.object({
            name: Joi.string().alphanum().required(),
            email: Joi.string().email().required(),
            money: Joi.number().required(),
            win_count: Joi.number().required(),
            lose_count: Joi.number().required(),
            role_id: Joi.number().required(),
            status: Joi.boolean().required(),
            agent_code: Joi.number().required(),
            password: Joi.string().required(),
        }),
        update: Joi.object({
            id: Joi.number().required(),
            name: Joi.string().required(),
            email: Joi.string().email().required(),
            money: Joi.number().required(),
            win_count: Joi.number().required(),
            lose_count: Joi.number().required(),
            role_id: Joi.number().required(),
            status: Joi.boolean().required(),
            agent_code: Joi.number().required(),
            password: Joi.string().allow(null, ""),
        }),
    },
    role: {
        create: Joi.object({
            id: Joi.number().required(),
            label: Joi.string().required(),
            fee: Joi.number().min(0).required(),
            type: Joi.string().required(),
        }),

    }
};

module.exports = {
    V,
    validator,
    retrunValidation,
}