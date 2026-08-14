const HttpError = require("../errors/HttpError");

async function findOrFail(operation) {
    const doc = await operation;
    if (!doc) {
        throw new HttpError("RESOURCE_NOT_FOUND");
    }
    return doc;
}

module.exports = findOrFail;