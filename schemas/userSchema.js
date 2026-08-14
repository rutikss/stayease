const Joi = require("joi");

const userSignInSchema = Joi.object({
    user: Joi.object({
        username: Joi.string().min(3).max(30).required(),
        email: Joi.string().email({ tlds: { allow: false } }).required(),
        password: Joi.string().min(6).required()
    }).required()
}).unknown(true);

const userLogInSchema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required()
}).unknown(true);

module.exports = { userSignInSchema, userLogInSchema };