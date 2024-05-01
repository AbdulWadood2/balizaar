// express
const express = require("express");
// express router
const ROUTE = express.Router();
// controller
const {
  SignupUser,
  verifyUser,
  logoutUser,
  loginUser,
  updateUser,
  getUser,
  forgotPassword,
  resetPassword,
  updateFcm,
  customizeFeed,
  getCustomizeFeed,
  createSearchAlert,
  getSearchAlert,
  reviewUser,
  getReview,
  getAllUsers,
  getUserInfo,
  blockUser,
  getSearchAlertNotification,
  getActiveNotification,
} = require("../Controller/user_controller.js");
// authentication
const { refreshToken, verifyToken } = require("../utils/verifyToken_util.js");
// model
const user_model = require("../Model/user_model.js");
const admin_model = require("../Model/admin_model.js");
/**
 * @swagger
 * /api/v1/user:
 *   post:
 *     summary: Signup User
 *     description: Endpoint to signup a user.
 *     tags:
 *       - User/account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               location:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [Point]
 *                     example: Point
 *                   coordinates:
 *                     type: array
 *                     items:
 *                       type: number
 *                     minItems: 2
 *                     maxItems: 2
 *                     example: [0, 0]
 *                 required:
 *                   - type
 *                   - coordinates
 *     responses:
 *       '202':
 *         description: User created, please verify it
 */
ROUTE.route("/").post(SignupUser);
/**
 * @swagger
 * /api/v1/user/verify:
 *   post:
 *     summary: Verify the user
 *     description: Verify the user using a provided verification code.
 *     tags:
 *       - User/account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       '202':
 *         description: User successfully verified.
 */
ROUTE.route("/verify").post(verifyUser);
/**
 * @swagger
 * /api/v1/user/login:
 *   post:
 *     summary: Login user
 *     description: Authenticate and login a user.
 *     tags:
 *       - User/account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email address of the user.
 *               password:
 *                 type: string
 *                 description: Password of the user.
 *     responses:
 *       '202':
 *         description: User authenticated successfully.
 */
ROUTE.route("/login").post(loginUser);
/**
 * @swagger
 * /api/v1/user/logout:
 *   post:
 *     summary: Logout User
 *     description: Endpoint to logout user.
 *     tags:
 *       - User/account
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
ROUTE.route("/logout").post(logoutUser);
/**
 * @swagger
 * /api/v1/user/refreshToken:
 *   get:
 *     summary: refresh Token api for user.
 *     description:
 *       refresh Token api for user
 *     tags:
 *       - User/account
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '202':
 *         description: refreshToken success
 */
ROUTE.route("/refreshToken").get(refreshToken(user_model));
/**
 * @swagger
 * /api/v1/user:
 *   put:
 *     summary: Update user
 *     description: Update user information.
 *     tags:
 *       - User/account
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's name.
 *               phoneNumber:
 *                 type: string
 *                 description: User's phone number.
 *               location:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [Point]
 *                     example: Point
 *                   coordinates:
 *                     type: array
 *                     items:
 *                       type: number
 *                     minItems: 2
 *                     maxItems: 2
 *                 description: User's location coordinates.
 *               bio:
 *                 type: string
 *                 description: User's biography.
 *               userImage:
 *                 type: string
 *                 description: URL of user's profile image.
 *               notification:
 *                 type: boolean
 *                 description: Whether to receive notifications.
 *     responses:
 *       '202':
 *         description: User updated successfully.
 */
ROUTE.route("/").put(verifyToken([user_model]), updateUser);
/**
 * @swagger
 * /api/v1/user/:
 *   get:
 *     summary: Get user profile
 *     description: Endpoint to fetch the profile of the authenticated user.
 *     tags:
 *       - User/account
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '202':
 *         description: User profile fetched successfully.
 */
ROUTE.route("/").get(verifyToken([user_model]), getUser);
/**
 * @swagger
 * /api/v1/user/forgot:
 *   post:
 *     summary: Forgot Password
 *     description: Sends a verification code to the user's email for password reset.
 *     tags:
 *       - User/account
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
 * /api/v1/user/resetPassword:
 *   post:
 *     summary: Reset Password
 *     description: Resets the password for a user with a valid verification code.
 *     tags:
 *       - User/account
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
 * /api/v1/user/fcm:
 *   post:
 *     summary: Update FCM key
 *     description: Update the FCM key for the user.
 *     tags:
 *       - User/account
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fcm_key:
 *                 type: string
 *                 description: The FCM key to be updated.
 *     responses:
 *       '202':
 *         description: FCM key successfully updated.
 */
ROUTE.route("/fcm").post(verifyToken([user_model]), updateFcm);

/**
 * @swagger
 * /api/v1/user/customizeFeed:
 *   post:
 *     summary: Customize Feed
 *     description: Customize the feed for the user.
 *     tags:
 *       - User/account
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categories:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of categories to customize the feed. (Optional)
 *     responses:
 *       '202':
 *         description: Feed customized successfully.
 */
ROUTE.route("/customizeFeed").post(verifyToken([user_model]), customizeFeed);
/**
 * @swagger
 * /api/v1/user/customizeFeed:
 *   get:
 *     summary: Get customize feed
 *     description: Retrieves the customize feed for the authenticated user.
 *     tags:
 *       - User/account
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '202':
 *         description: Successfully retrieved the customize feed.
 */
ROUTE.route("/customizeFeed").get(verifyToken([user_model]), getCustomizeFeed);

/**
 * @swagger
 * /api/v1/user/searchAlert:
 *   post:
 *     summary: Create search alert
 *     description: Create a new search alert for the user.
 *     tags:
 *       - User/account
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categories:
 *                 type: array
 *                 items:
 *                   type: string
 *               minMaxPrice:
 *                 type: object
 *                 properties:
 *                   min:
 *                     type: number
 *                   max:
 *                     type: number
 *               searchWords:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       '202':
 *         description: Alert created or updated successfully.
 */
ROUTE.route("/searchAlert").post(verifyToken([user_model]), createSearchAlert);

/**
 * @swagger
 * /api/v1/user/searchAlert:
 *   get:
 *     summary: Get search alert
 *     description: Retrieve the search alert for the authenticated user.
 *     tags:
 *       - User/account
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '202':
 *         description: Search alert fetched successfully.
 */
ROUTE.route("/searchAlert").get(verifyToken([user_model]), getSearchAlert);

/**
 * @swagger
 * /api/v1/user/review:
 *   post:
 *     summary: Review user
 *     description: Create or update a review for a user.
 *     tags:
 *       - User/account
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sallerId:
 *                 type: string
 *               stars:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       '202':
 *         description: Review created or updated successfully.
 */
ROUTE.route("/review").post(verifyToken([user_model]), reviewUser);

/**
 * @swagger
 * /api/v1/user/review:
 *   get:
 *     summary: Get review
 *     description: Retrieve reviews for a seller.
 *     tags:
 *       - Reviews
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sallerId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the seller to retrieve reviews for.
 *     responses:
 *       '202':
 *         description: Reviews fetched successfully.
 */
ROUTE.route("/review").get(verifyToken([user_model, admin_model]), getReview);

/**
 * @swagger
 * /api/v1/user/all:
 *   get:
 *     summary: Get all users
 *     description: Retrieve all users from the database. Optionally filter users based on their blocked status.
 *     tags:
 *       - Admin/account
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isBlocked
 *         schema:
 *           type: boolean
 *         description: Filter users based on their blocked status. Set to true to get only blocked users, false to get only unblocked users.
 *     responses:
 *       '202':
 *         description: A list of users.
 */

ROUTE.route("/all").get(verifyToken([admin_model]), getAllUsers);

/**eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2MDQzM2RhODhlN2Q5Y2RmYmZiMWU1MyIsInVuaXF1ZUlkIjoiM1d2azJ1N0lLQSIsImlhdCI6MTcxMjMxNjA3MSwiZXhwIjoxNzEyMzE2OTcxfQ.Jw484JW9xHYF1-Q5Dgecd_WNLZRWPRPMCK2Tc0ZXp8A
 * @swagger
 * /api/v1/user/info:
 *   get:
 *     summary: Get user info
 *     description: Retrieve detailed information about a user, including their listings and reviews.
 *     tags:
 *       - Admin/account
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the user to retrieve information for.
 *     responses:
 *       '202':
 *         description: Detailed information about the user
 */
ROUTE.route("/info").get(verifyToken([admin_model]), getUserInfo);

/**
 * @swagger
 * /api/v1/user/block:
 *   get:
 *     summary: Get user info and block/unblock user
 *     description: This endpoint is used to get user info and block/unblock a user. Only accessible for admin users.
 *     tags:
 *       - Admin/account
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to be blocked/unblocked.
 *     responses:
 *       '202':
 *         description: User blocked/unblocked successfully.
 */
ROUTE.route("/block").get(verifyToken([admin_model]), blockUser);

/**
 * Get search alert notification
 *
 * @swagger
 * /api/v1/user/searchAlertNotification:
 *   get:
 *     summary: Get search alert notification
 *     description: Retrieve search alert notifications for the logged-in user
 *     tags:
 *       - User/account
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '202':
 *         description: Search alert notifications retrieved successfully
 */
ROUTE.route("/searchAlertNotification").get(
  verifyToken([user_model]),
  getSearchAlertNotification
);

/**
 * Get active notification
 *
 * @swagger
 * /api/v1/user/activeNotification:
 *   get:
 *     summary: Get active notification
 *     description: Retrieve active notifications for the logged-in user
 *     tags:
 *       - User/account
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '202':
 *         description: Active notifications retrieved successfully
 */
ROUTE.route("/activeNotification").get(
  verifyToken([user_model]),
  getActiveNotification
);


module.exports = ROUTE;
