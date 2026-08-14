const cloudinary = require("../config/cloudinary");

const uploadToCloudinary = (fileBuffer) =>
    new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: "project_uploads", resource_type: "image" },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        stream.end(fileBuffer);
    });

module.exports = uploadToCloudinary;