const express = require("express");

const router = express.Router();

// Controller
const {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getOtherCategories,
} = require("../Controller/category_controller");
// security
const { verifyToken } = require("../utils/verifyToken_util");
// models
const user_model = require("../Model/user_model");
const admin_model = require("../Model/admin_model");

/**
 * @swagger
 * /api/v1/category/:
 *   post:
 *     summary: Create a category
 *     description: Endpoint to create a new category.
 *     tags:
 *       - Admin/Category
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categoryName:
 *                 type: string
 *                 description: The name of the category.
 *                 required: true
 *               categoryImage:
 *                 type: string
 *                 description: The image of the category.
 *                 required: true
 *     responses:
 *       '202':
 *         description: Category created successfully.
 */

router.post("/", verifyToken([admin_model]), createCategory);

/**
 * @swagger
 * /api/v1/category/{id}:
 *   put:
 *     summary: Update a category
 *     description: Endpoint to update an existing category.
 *     tags:
 *       - Admin/Category
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the category to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categoryName:
 *                 type: string
 *               categoryImage:
 *                 type: string
 *             required:
 *               - categoryName
 *     responses:
 *       '202':
 *         description: Category updated successfully.
 */
router.put("/:id", verifyToken([admin_model]), updateCategory);
/**
 * @swagger
 * /api/v1/category/{id}:
 *   delete:
 *     summary: Delete a category
 *     description: Endpoint to delete an existing category.
 *     tags:
 *       - Admin/Category
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the category to delete.
 *     responses:
 *       '202':
 *         description: Category deleted successfully.
 */
router.delete("/:id", verifyToken([admin_model]), deleteCategory);

/**
 * @swagger
 * /api/v1/category/:
 *   get:
 *     summary: Get all categories
 *     description: Retrieves all categories along with the count of products in each category.
 *     tags:
 *       - Category
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successful operation. Returns all categories with their respective product counts.
 */
router.get("/", verifyToken([user_model, admin_model]), getAllCategories);

/**
 * @swagger
 * /api/v1/category/other:
 *   get:
 *     summary: Get other categories
 *     description: Retrieves other categories along with their respective products.
 *     tags:
 *       - Category
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successful operation. Returns other categories with their respective products.
 */
router.get("/other", verifyToken([user_model, admin_model]), getOtherCategories);

module.exports = router;
