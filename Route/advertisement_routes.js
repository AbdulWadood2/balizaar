const express = require("express");
const {
  createAdvertisement,
  getAdvertisements,
  updateAdvertisement,
  deleteAdvertisement,
} = require("../Controller/advertisement_controller");
const ROUTE = express.Router();
//model
const user_model = require("../Model/user_model");
const admin_model = require("../Model/admin_model");

const { verifyToken } = require("../utils/verifyToken_util");

/**
 * @swagger
 * /api/v1/advertisement/:
 *   post:
 *     summary: Create advertisement
 *     description: Only admin can access
 *     tags:
 *       - Admin/advertisement
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
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               url:
 *                 type: string
 *             required:
 *               - name
 *               - images
 *               - url
 *     responses:
 *       '202':
 *         description: Advertisement created
*/
ROUTE.route("/").post(verifyToken([admin_model]), createAdvertisement);

/**
 * @swagger
 * /api/v1/advertisement/:
 *   get:
 *     summary: Get all advertisements
 *     description: All users can access
 *     tags:
 *       - User/advertisement
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Advertisements retrieved
 */
ROUTE.route("/").get(verifyToken([user_model, admin_model]), getAdvertisements);

/**
 * @swagger
 * /api/v1/advertisement/{id}:
 *   put:
 *     summary: Update advertisement
 *     description: Only admin can access
 *     tags:
 *       - Admin/advertisement
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         description: ID of the advertisement to update
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               url:
 *                 type: string
 *             required:
 *               - name
 *               - images
 *               - url
 *     responses:
 *       '200':
 *         description: Advertisement updated
 */
ROUTE.route("/:id").put(verifyToken([admin_model]), updateAdvertisement);

/**
 * @swagger
 * /api/v1/advertisement/{id}:
 *   delete:
 *     summary: Delete advertisement
 *     description: Only admin can access
 *     tags:
 *       - Admin/advertisement
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         description: ID of the advertisement to delete
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Advertisement deleted
 */
ROUTE.route("/:id").delete(verifyToken([admin_model]), deleteAdvertisement);

module.exports = ROUTE;
