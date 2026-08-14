const Joi = require("joi");

const listingSchema = Joi.object({
    listing: Joi.object({
        title:       Joi.string().min(2).max(60).required(),
        description: Joi.string().min(2).max(250).required(),
        location:    Joi.string().min(2).max(200).required(),
        country:     Joi.string().min(2).max(50).required(),
        price:       Joi.number().min(0).required()
    }).required()
}).unknown(true);

const paramsSchema = Joi.object({
    id: Joi.string().hex().length(24).required()
});

const reviewParamsSchema = Joi.object({
    id:       Joi.string().hex().length(24).required(),
    reviewId: Joi.string().hex().length(24).required()
});

module.exports = { listingSchema, paramsSchema, reviewParamsSchema };