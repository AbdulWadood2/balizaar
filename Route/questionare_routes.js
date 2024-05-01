// express
const express = require("express");
// express router
const ROUTE = express.Router();
// controller
const {
  createQuestionare,
  getAllQuestionare,
  editQuestionare,
  deleteQuestionare,
} = require("../Controller/questionare_controller.js");
// authentication
const { verifyToken } = require("../utils/verifyToken_util.js");
// model
const user_model = require("../Model/user_model.js");
const admin_model = require("../Model/admin_model.js");

// route
/**
 * @swagger
 * /api/v1/questionare:
 *   post:
 *     summary: Create a questionare
 *     description: This endpoint is used to create a questionare. Only accessible for admin users.
 *     tags:
 *       - Admin/Questionare
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               question:
 *                 type: string
 *               answer:
 *                 type: string
 *               category:
 *                 type: string
 *             required:
 *               - question
 *               - answer
 *               - category
 *     responses:
 *       '201':
 *         description: Questionare created successfully.
 */
ROUTE.post(
  "/",
  verifyToken([admin_model]),
  createQuestionare
);

/**
 * @swagger
 * /api/v1/questionare:
 *   get:
 *     summary: Get all questionares
 *     description: This endpoint is used to get all questionares. Accessible for all users.
 *     tags:
 *       - Questionare
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: All questionares fetched successfully.
 */
ROUTE.get(
  "/",
  verifyToken([user_model, admin_model]),
  getAllQuestionare
);

/**
 * @swagger
 * /api/v1/questionare:
 *   put:
 *     summary: Edit a questionare
 *     description: Edit a questionare by providing its ID and updated data.
 *     tags:
 *       - Admin/Questionare
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               question:
 *                 type: string
 *               answer:
 *                 type: string
 *               category:
 *                 type: string
 *             required:
 *               - question
 *               - answer
 *               - category
 *     parameters:
 *       - in: query
 *         name: questionareId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the questionare to edit.
 *     responses:
 *       '201':
 *         description: Successful operation. Returns the edited questionare.
 */
ROUTE.put(
  "/",
  verifyToken([admin_model]),
  editQuestionare
);

/**
 * @swagger
 * /api/v1/questionare:
 *   delete:
 *     summary: Delete a questionare
 *     description: Delete a questionare by providing its ID.
 *     tags:
 *       - Admin/Questionare
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: questionareId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the questionare to delete.
 *     responses:
 *       '200':
 *         description: Successful operation. Indicates that the questionare was deleted successfully.
 */
ROUTE.delete(
  "/",
  verifyToken([admin_model]),
  deleteQuestionare 
);

module.exports = ROUTE;
