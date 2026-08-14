const AppError = require("./AppError");

class DatabaseError extends AppError {
    constructor(message = null) {
        super("DATABASE_ERROR", message);
    }
}

module.exports = DatabaseError;