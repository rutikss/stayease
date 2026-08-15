module.exports = {

  RESOURCE_NOT_FOUND: {
    statusCode: 404,
    message: "Resource not found"
  },

  VALIDATION_ERROR: {
    statusCode: 400,
    message: "Validation failed"
  },

  INVALID_ID: {
    statusCode: 400,
    message: "Invalid resource ID"
  },

  UNAUTHORIZED: {
    statusCode: 401,
    message: "Unauthorized"
  },

  FORBIDDEN: {
    statusCode: 403,
    message: "Forbidden"
  },

  DUPLICATE_ENTRY: {
    statusCode: 409,
    message: "Duplicate field value"
  },

  DATABASE_ERROR: {
    statusCode: 500,
    message: "Database operation failed"
  },

  INTERNAL_SERVER_ERROR: {
    statusCode: 500,
    message: "Something went wrong"
  }

};