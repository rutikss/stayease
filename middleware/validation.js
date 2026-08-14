const HttpError = require("../errors/HttpError");

module.exports = (schema, property) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[property]);

        if (error) {
            return next(new HttpError("VALIDATION_ERROR", error.details[0].message));
        }

        req[property] = value;
        next();
    };
};