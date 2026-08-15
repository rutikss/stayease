const definitions = require("./errorDefinitions");

class AppError extends Error {
    constructor(code, customMessage = null) {
        const def = definitions[code];

        if (!def) {
            throw new Error(`Unknown error code: ${code}`);
        }

        super(customMessage || def.message);

        this.code = code;
        this.statusCode = def.statusCode;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;