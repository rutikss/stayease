const AppError = require("./AppError");

class ValidationError extends AppError {
    constructor(message = null) {
        super("VALIDATION_ERROR", message);
    }
}

module.exports = ValidationError;