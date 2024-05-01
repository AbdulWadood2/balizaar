// express
const express = require("express");
// express router
const ROUTE = express.Router();
// controller
const {
  createProduct,
  getAllProducts,
  updateProduct,
  deleteProduct,
  nearestProductsOrsearch,
  getProductById,
  likeDislikeProduct,
  getFavouriteProducts,
  getClientsforSell,
  changeProductStatus,
  getTopSellingItems,
  getPurchaseHistory,
  getAllProductsForAdmin,
  getProductByIdForAdmin,
} = require("../Controller/product_controller.js");
// authentication
const { refreshToken, verifyToken } = require("../utils/verifyToken_util.js");
// model
const user_model = require("../Model/user_model.js");
const admin_model = require("../Model/admin_model.js");
/**
 * @swagger
 * /api/v1/product:
 *   post:
 *     summary: Create a new product
 *     description: Create a new product in the system.
 *     tags:
 *       - User/Product
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productImage:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 1
 *                 description: Array of product images. At least one image is required.
 *               productName:
 *                 type: string
 *                 description: Name of the product.
 *               listingType:
 *                 type: string
 *                 enum:
 *                   - "0"
 *                   - "1"
 *                 description: Listing type of the product. Can be '0' or '1'.
 *               productPrice:
 *                 type: number
 *                 description: Price of the product.
 *               openToOffers:
 *                 type: boolean
 *                 default: false
 *                 description: Indicates if the product is open to offers.
 *               productDescription:
 *                 type: string
 *                 description: Description of the product.
 *               categoryName:
 *                 type: string
 *                 description: Category of the product.
 *     responses:
 *       '202':
 *         description: Product created successfully.
 */
ROUTE.post("/", verifyToken([user_model]), createProduct);

/**
 * @swagger
 * /api/v1/product:
 *   get:
 *     summary: Get all products
 *     description: Retrieve all products created by the authenticated user.
 *     tags:
 *       - User/Product
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: productStatus
 *         schema:
 *           type: string
 *         description: Status of the product
 *     responses:
 *       '200':
 *         description: Successfully retrieved all products.
 */
ROUTE.get("/", verifyToken([user_model]), getAllProducts);

/**
 * @swagger
 * /api/v1/product/{id}:
 *   put:
 *     summary: Update a product
 *     description: Update an existing product identified by its ID.
 *     tags:
 *       - User/Product
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         description: ID of the product to update
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
 *               productImage:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of product images.
 *               productName:
 *                 type: string
 *                 description: Name of the product.
 *               listingType:
 *                 type: string
 *                 enum:
 *                   - "0"
 *                   - "1"
 *                 description: Listing type of the product. Can be '0' or '1'.
 *               productPrice:
 *                 type: number
 *                 description: Price of the product.
 *               openToOffers:
 *                 type: boolean
 *                 default: false
 *                 description: Indicates if the product is open to offers.
 *               productDescription:
 *                 type: string
 *                 description: Description of the product.
 *               categoryName:
 *                 type: string
 *                 description: Category of the product.
 *     responses:
 *       '200':
 *         description: Product updated successfully.
 */
ROUTE.put("/:id", verifyToken([user_model]), updateProduct);

/**
 * @swagger
 * /api/v1/product/{id}:
 *   delete:
 *     summary: Delete a product
 *     description: Delete an existing product identified by its ID.
 *     tags:
 *       - User/Product
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         description: ID of the product to delete
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '202':
 *         description: Product deleted successfully.
 */
ROUTE.delete("/:id", verifyToken([user_model]), deleteProduct);

/**
 * @swagger
 * /api/v1/product/nearest:
 *   post:
 *     summary: Get nearest products or search products
 *     description: Retrieve the nearest products based on user's location and search term.
 *     tags:
 *       - User/Product
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               searchTerm:
 *                 type: string
 *                 description: Optional search term to filter products.
 *               searchRadius:
 *                 type: number
 *                 description: Search radius for filtering products.
 *               category:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Category or categories for filtering products.
 *               sort:
 *                 type: number
 *                 enum: [0, 1]
 *                 description: Sort criteria for filtering products. (0 - Relevant, 1 - Most Recent)
 *               price:
 *                 type: object
 *                 properties:
 *                   min:
 *                     type: number
 *                     description: Minimum price for filtering products.
 *                   max:
 *                     type: number
 *                     description: Maximum price for filtering products.
 *     responses:
 *       '200':
 *         description: Successful operation
 */
ROUTE.post("/nearest", verifyToken([user_model]), nearestProductsOrsearch);

/**
 * @swagger
 * /api/v1/product/{id}:
 *   get:
 *     summary: Get product by ID
 *     description: Retrieve product details along with user information, other products by the same user, and related items.
 *     tags:
 *       - User/Product
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the product to retrieve
 *     responses:
 *       '202':
 *         description: Successful response with product details
 */
ROUTE.get("/:id", verifyToken([user_model]), getProductById);

/**
 * Like or dislike a product.
 *
 * @swagger
 * /api/v1/product/favourite/{id}:
 *   post:
 *     summary: Like or dislike a product
 *     description: Like or dislike a product identified by its ID.
 *     tags:
 *       - User/Product
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         description: ID of the product to like or dislike
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Product liked or disliked successfully.
 */
ROUTE.post("/favourite/:id", verifyToken([user_model]), likeDislikeProduct);

/**
 * @swagger
 * /api/v1/product/favourite:
 *   post:
 *     summary: Get all favourite products
 *     description: Retrieve all products marked as favourites by the user.
 *     tags:
 *       - User/Product
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Successful response with favourite products
 */
ROUTE.post("/favourite", verifyToken([user_model]), getFavouriteProducts);

/**
 * @swagger
 * /api/v1/product/getClients/forSell:
 *   get:
 *     summary: Get all clients for selling products
 *     description: Retrieve all unique clients who have sent messages to the current user as a receiver.
 *     tags:
 *       - User/Product
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: A list of unique client IDs.
 */
ROUTE.get("/getClients/forSell", verifyToken([user_model]), getClientsforSell);

/**
 * @swagger
 * /api/v1/product/changeProductStatus/:
 *   post:
 *     summary: Change product status
 *     description: Change the status of a product identified by its ID.
 *     tags:
 *       - User/Product
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *                 description: The ID of the product to update.
 *               productStatus:
 *                 type: number
 *                 description: The new status of the product. Possible values are 0, 1, or 2.
 *               clientId:
 *                 type: string
 *                 description: The ID of the client associated with the product (optional).
 *     responses:
 *       '200':
 *         description: Product status updated successfully.
 */
ROUTE.post(
  "/changeProductStatus",
  verifyToken([user_model]),
  changeProductStatus
);

/**
 * @swagger
 * /api/v1/product/topSelling/items:
 *   get:
 *     summary: Get top selling items
 *     description: Retrieves the top selling items.
 *     tags:
 *       - User/Product
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successful operation
 */
ROUTE.get("/topSelling/items", verifyToken([user_model]), getTopSellingItems);
/**
 * @swagger
 * /api/v1/product/purchase/history:
 *   get:
 *     summary: Get purchase history
 *     description: Retrieves the purchase history of the authenticated user.
 *     tags:
 *       - User/Product
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successful operation
 */
ROUTE.get("/purchase/history", verifyToken([user_model]), getPurchaseHistory);

/**
 * @swagger
 * /api/v1/product/admin/getProducts:
 *   get:
 *     summary: Get all products for admin
 *     description: This endpoint is used to retrieve all products, specifically for admin users.
 *     tags:
 *       - Admin/Product
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Successfully retrieved all products.
 */
ROUTE.get(
  "/admin/getProducts",
  verifyToken([admin_model]),
  getAllProductsForAdmin
);

/**
 * @swagger
 * /api/v1/product/admin/getProduct/{id}:
 *   get:
 *     summary: Get product by ID for admin
 *     description: Retrieve product detail with sale quantity.
 *     tags:
 *       - Admin/Product
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the product to retrieve
 *     responses:
 *       '200':
 *         description: Successful response with product details
 */

ROUTE.get(
  "/admin/getProduct/:id",
  verifyToken([admin_model]),
  getProductByIdForAdmin
);

module.exports = ROUTE;
