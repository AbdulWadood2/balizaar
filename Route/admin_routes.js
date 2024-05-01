// express
const express = require("express");
// express router
const ROUTE = express.Router();
// controller
const {
  loginAdmin,
  logoutAdmin,
  resetPassword,
  forgotPassword,
  dashboard,
  updateDocuments,
  getDocuments,
  sendNotification,
} = require("../Controller/admin_controller.js");
// authentication
const { verifyToken, refreshToken } = require("../utils/verifyToken_util.js");
// model
const admin_model = require("../Model/admin_model.js");
const user_model = require("../Model/user_model.js");

/**
 * @swagger
 * /api/v1/admin/login:
 *   post:
 *     summary: Login to the admin panel
 *     description: Endpoint to login as an admin user.
 *     tags:
 *       - Admin/account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: Admin email
 *               password:
 *                 type: string
 *                 description: Admin password
 *     responses:
 *       '202':
 *         description: Login successful
 */
ROUTE.route("/login").post(loginAdmin);
/**
 * @swagger
 * /api/v1/admin/logout:
 *   post:
 *     summary: Logout Admin
 *     description: Endpoint to logout admin.
 *     tags:
 *       - Admin/account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *             required:
 *               - refreshToken
 *     responses:
 *       '202':
 *         description: Logout Success
 */
ROUTE.route("/logout").post(logoutAdmin);
/**
 * @swagger
 * /api/v1/admin/refreshToken:
 *   get:
 *     summary: refresh Token api for user.
 *     description:
 *       refresh Token api for admin
 *     tags:
 *       - Admin/account
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '202':
 *         description: refreshToken success
 */
ROUTE.route("/refreshToken").get(refreshToken(admin_model));

/**
 * @swagger
 * /api/v1/admin/forgot:
 *   post:
 *     summary: Forgot Password
 *     description: Sends a verification code to the user's email for password reset.
 *     tags:
 *       - Admin/account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: The email address of the user.
 *     responses:
 *       '202':
 *         description: Verification code sent successfully.
 */
ROUTE.route("/forgot").post(forgotPassword);

/**
 * @swagger
 * /api/v1/admin/resetPassword:
 *   post:
 *     summary: Reset Password
 *     description: Resets the password for a user with a valid verification code.
 *     tags:
 *       - Admin/account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: The email address of the user.
 *               code:
 *                 type: string
 *                 description: The verification code received by the user's email.
 *               password:
 *                 type: string
 *                 description: The new password for the user's account.
 *     responses:
 *       '202':
 *         description: Password successfully reset.
 */
ROUTE.route("/resetPassword").post(resetPassword);

/**
 * @swagger
 * /api/v1/admin/dashboard:
 *   get:
 *     summary: Get dashboard data
 *     description: Retrieves dashboard data including product count, user count, top sellers, top selling categories, and earnings per month.
 *     tags:
 *       - Admin/account
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successful response with dashboard data
 */
ROUTE.route("/dashboard").get(verifyToken([admin_model]), dashboard);
/**
 * @swagger
 * /api/v1/admin/documents:
 *   post:
 *     summary: Update documents
 *     description: Update the documents such as privacy policy, terms and conditions, and about us.
 *     tags:
 *       - Admin/account
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               privacy_policy:
 *                 type: string
 *                 description: The updated privacy policy content.
 *               terms_and_conditions:
 *                 type: string
 *                 description: The updated terms and conditions content.
 *               about_us:
 *                 type: string
 *                 description: The updated about us content.
 *     responses:
 *       '200':
 *         description: Documents updated successfully.
 */
ROUTE.route("/documents").post(verifyToken([admin_model]), updateDocuments);

/**
 * @swagger
 * /api/v1/admin/documents:
 *   get:
 *     summary: Get documents
 *     description: Retrieve documents including privacy policy, terms and conditions, and about us information.
 *     tags:
 *       - Documents
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Successful operation. Returns documents data.
 */
ROUTE.route("/documents").get(
  verifyToken([admin_model, user_model]),
  getDocuments
);

/**
 * @swagger
 * /api/v1/admin/notifications:
 *   post:
 *     summary: Send notification
 *     description: Send notification to a specific user or to all users if no receiverId is provided
 *     tags:
 *       - Admin/account
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               receiverId:
 *                 type: string
 *                 description: The ID of the receiver. If not provided, the notification will be sent to all users.
 *               message:
 *                 type: string
 *                 description: The message of the notification.
 *                 example: Hello, world!
 *     responses:
 *       '200':
 *         description: Notification sent successfully
 */
ROUTE.route("/notifications").post(
  verifyToken([admin_model]),
  sendNotification
);

module.exports = ROUTE;
