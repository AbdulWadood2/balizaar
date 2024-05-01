const express = require("express");

const router = express.Router();

// Controller
const { sendContactUs, getAllContactUs, makeResolved } = require("../Controller/contactUs_controller");
// security
const { verifyToken } = require("../utils/verifyToken_util");
// models
const user_model = require("../Model/user_model");
const admin_model = require("../Model/admin_model");

/**
 * @swagger
 * /api/v1/contact:
 *   post:
 *     summary: Send contact us message
 *     description: Sends a contact us message from a user.
 *     tags:
 *       - user/contactUs
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subject:
 *                 type: string
 *                 description: User's email address
 *                 required: true
 *               message:
 *                 type: string
 *                 description: Message content
 *                 required: true
 *     responses:
 *       '200':
 *         description: Message sent successfully
 */
router.post("/", verifyToken([user_model]), sendContactUs);

/**
 * @swagger
 * /api/v1/contact/:
 *   get:
 *     summary: Get all contact us messages
 *     description: Retrieve all contact us messages from the database.
 *     tags:
 *       - admin/contactUs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: resolved
 *         schema:
 *           type: boolean
 *         description: Filter contact us messages by resolution status (true for resolved, false for unresolved).
 *     responses:
 *       '200':
 *         description: A list of contact us messages
 */
router.get("/", verifyToken([admin_model]), getAllContactUs);

/**
 * @swagger
 * /api/v1/contact/{id}:
 *   put:
 *     summary: Mark contact message as resolved
 *     description: Mark a contact message as resolved by updating its `resolved` status to true.
 *     tags:
 *       - admin/contactUs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the contact message to mark as resolved.
 *     responses:
 *       '200':
 *         description: Message marked as resolved successfully
 */
router.put("/:id", verifyToken([admin_model]), makeResolved);

module.exports = router;
