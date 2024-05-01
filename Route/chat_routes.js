// express
const express = require("express");
// express router
const ROUTE = express.Router();
// controller
const {
  sendChatMessage,
  getChatMessage,
  seenChatMessage,
  deleteChatMessage,
  getOneToOneChatMessage,
} = require("../Controller/chat_controller.js");
// authentication
const { refreshToken, verifyToken } = require("../utils/verifyToken_util.js");
// model
const user_model = require("../Model/user_model.js");

/**
 * @swagger
 * /api/v1/chat/:
 *   post:
 *     summary: Send Chat Message
 *     description: Allows a user to send a chat message to another user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               receiverId:
 *                 type: string
 *                 description: The ID of the receiver user.
 *               message:
 *                 type: string
 *                 description: The message content.
 *     tags:
 *       - User/chat
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '202':
 *         description: Success response with the sent chat message.
 */
ROUTE.post("/", verifyToken([user_model]), sendChatMessage);

/**
 * @swagger
 * /api/v1/chat/:
 *   get:
 *     summary: Get Chat Messages
 *     description: Retrieves chat messages between the authenticated user and another user.
 *     parameters:
 *       - in: query
 *         name: receiverId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to retrieve chat messages with.
 *     tags:
 *       - User/chat
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Success response with the retrieved chat messages.
 */
ROUTE.get("/", verifyToken([user_model]), getChatMessage);

/**
 * @swagger
 * /api/v1/chat/seen:
 *   get:
 *     summary: Mark Chat Messages as Seen
 *     description: Marks chat messages between the authenticated user and another user as seen.
 *     parameters:
 *       - in: query
 *         name: receiverId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user whose chat messages need to be marked as seen.
 *     tags:
 *       - User/chat
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Success response indicating that chat messages have been marked as seen.
 */
ROUTE.get("/seen", verifyToken([user_model]), seenChatMessage);

/**
 * @swagger
 * /api/v1/chat/:
 *   delete:
 *     summary: Delete Chat Messages
 *     description: Deletes chat messages between the authenticated user and another user.
 *     parameters:
 *       - in: query
 *         name: receiverId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user whose chat messages need to be deleted.
 *     tags:
 *       - User/chat
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Success response indicating that chat messages have been deleted.
 */
ROUTE.delete("/", verifyToken([user_model]), deleteChatMessage);

/**
 * @swagger
 * /api/v1/chat/oneToOne:
 *   get:
 *     summary: Get ono-to-on chat heads
 *     description: Get ono-to-on chat heads for the authenticated user.
 *     tags:
 *       - User/chat
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Success response with the retrieved one-to-one chat messages.
 */
ROUTE.get("/oneToOne", verifyToken([user_model]), getOneToOneChatMessage);

module.exports = ROUTE;
