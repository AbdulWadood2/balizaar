/* functions */
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { successMessage } = require("../functions/utility_functions");
/* error */
const AppError = require("../utils/appError");
/* aws */
const { s3 } = require("../utils/aws");

const uploadProductImg = async (req, res, next) => {
  try {
    const files = req.files["file"];
    if (!files || files.length === 0) {
      return next(new AppError("No files provided", 400));
    }
    let fileName;
    // Create an array to store promises for each S3 upload
    const uploadPromises = files.map((file) => {
      fileName = `${file.fieldname}_${Date.now()}_${file.originalname}`;
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      return s3.send(new PutObjectCommand(params)); // Use send method to send command
    });

    // Wait for all S3 uploads to complete
    const uploadResults = await Promise.all(uploadPromises);

    // Construct URLs for uploaded objects
    const urls = uploadResults.map((result) => {
      return `${fileName}`;
    });

    return successMessage(202, res, "Files uploaded successfully", urls);
  } catch (error) {
    return next(new AppError(error, 500));
  }
};

module.exports = { uploadProductImg };
