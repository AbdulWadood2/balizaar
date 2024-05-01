const express = require("express");
const { uploadProductImg } = require("../Controller/aws_controller");
const ROUTE = express.Router();
const multer = require("multer");
//model
const user_model = require("../Model/user_model");
const admin_model = require("../Model/admin_model");
const { verifyToken } = require("../utils/verifyToken_util");
const multerStorageUser = multer.memoryStorage();
const upload = multer({
  storage: multerStorageUser,
});

/**
 * @swagger
 * /api/v1/aws/uploadImg:
 *   post:
 *     summary: Upload product images for user only.
 *     description: Uploads product images to AWS S3 bucket. Requires authentication.
 *     tags:
 *       - fileUpload
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       202:
 *         description: Files uploaded successfully
 */
ROUTE.route("/uploadImg").post(
  verifyToken([user_model, admin_model]),
  upload.fields([{ name: "file", maxCount: 100 }]),
  uploadProductImg
);

module.exports = ROUTE;
