const AppError = require("./AppError");

class HttpError extends AppError {
    constructor(code, message = null) {
        super(code, message);
    }
}

module.exports = HttpError;