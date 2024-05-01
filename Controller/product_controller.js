// models
const Product = require("../Model/product_model");
const user_model = require("../Model/user_model");
const category_model = require("../Model/category_model");
const favouriteProduct_model = require("../Model/favouriteProduct_model");
const productSeen_model = require("../Model/productSeen_model");
const sale_model = require("../Model/sales_model");
const chat_model = require("../Model/chat_model");
const customizeFeed_model = require("../Model/customizeFeed_model");
const searchAlertNotification_model = require("../Model/searchAlertNotification_model");
const searchAlert_model = require("../Model/searchAlert_model");
// catch async
const catchAsync = require("../utils/catchAsync");
// app error
const AppError = require("../utils/appError");

const {
  productValidationSchema,
  editProductValidationSchema,
  editProductStatusValidation,
  filterProductJoiSchema,
} = require("../utils/joi_validator");
const {
  successMessage,
  checkDuplicateAwsImgsInRecords,
  sendFirbaseNotification,
} = require("../functions/utility_functions");
const {
  generateSignedUrl,
  deleteObjects,
  checkImageExists,
  getFileName,
} = require("../utils/aws");

// method post
// route /api/v1/product
// @privacy only user can do this
const createProduct = catchAsync(async (req, res, next) => {
  const { error, value } = productValidationSchema.validate(req.body);

  // Check for validation errors
  if (error) {
    // If validation fails, respond with the validation error
    return successMessage(400, res, error.details[0].message);
  }

  const categoryExists = await category_model.findOne({
    categoryName: value.categoryName,
  });
  if (!categoryExists) {
    return successMessage(400, res, "Category does not exist");
  }
  const duplicateProduct = await checkDuplicateAwsImgsInRecords(
    value.productImage,
    "productImage"
  );
  if (!duplicateProduct.success) {
    return successMessage(400, res, duplicateProduct.message);
  }
  let newProduct = await Product.create({
    userId: req.user.id,
    ...value,
    category: [value.categoryName],
  });
  const signUrl = await generateSignedUrl(newProduct.productImage);
  newProduct.productImage = signUrl;
  const productowner = await user_model.findById(req.user.id);
  const [longitude, latitude] = productowner.location.coordinates;
  const nearestUsers = await user_model.find({
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
        $maxDistance: 10 * 1000,
      },
    },
    _id: { $ne: req.user.id },
  });
  const users = nearestUsers.map(async (user) => {
    const userSearchAlert = await searchAlert_model.findOne({
      userId: user._id,
    });
    if (userSearchAlert) {
      // if newProduct category is matched with userSearchAlert categories array
      // or the product price within min max of userSearchAlert min max
      const minMaxPrice = userSearchAlert.minMaxPrice;
      const min = minMaxPrice.min;
      const max = minMaxPrice.max;
      // Split name into words
      const nameWords = newProduct.productName.split(/\s+/);
      if (
        (userSearchAlert.categories.length > 0
          ? userSearchAlert.categories.some((category) =>
              newProduct.category.includes(category)
            )
          : true &&
            newProduct.productPrice >= min &&
            newProduct.productPrice <= max) ||
        (newProduct.productPrice >= min &&
        newProduct.productPrice <= max &&
        userSearchAlert.searchWords.length > 0
          ? userSearchAlert.searchWords.some((word) => {
              const wordInLowerCase = word.toLowerCase();
              return nameWords.some((nameWord) =>
                wordInLowerCase.includes(nameWord.toLowerCase())
              );
            })
          : true)
      ) {
        await searchAlertNotification_model.create({
          receiverId: user._id,
          productId: newProduct._id,
        });
        if (user.notification) {
          if (user.fcm_key.length > 0) {
            const data = {
              notification: {
                title: "search Alert",
                body: {
                  receiverId: user._id,
                  productId: newProduct._id,
                  productImages: newProduct.productImage,
                  productName: newProduct.productName,
                  productDescription: newProduct.productDescription,
                },
              },
              data: {
                title: "search Alert",
                body: {
                  receiverId: user._id,
                  productId: newProduct._id,
                  productImages: newProduct.productImage,
                  productName: newProduct.productName,
                  productDescription: newProduct.productDescription,
                },
              },
              registration_ids: user.fcm_key,
            };

            await sendFirbaseNotification(data, process.env.fireBaseServerKey);
          }
        }
      }
    }
  });
  await Promise.all(users);
  return successMessage(202, res, "Product created successfully", newProduct);
});
// method get
// route /api/v1/product
// @privacy only user can do this
// only use get his products
const getAllProducts = catchAsync(async (req, res, next) => {
  const { productStatus } = req.query;
  let products;
  if (productStatus) {
    products = await Product.find({
      userId: req.user.id,
      productStatus: productStatus,
    }).lean();
  } else {
    products = await Product.find({
      userId: req.user.id,
    }).lean();
  }
  products = products.map(async (product) => {
    const signUrl = await generateSignedUrl(product.productImage);
    product.productImage = signUrl;
    const favouriteProduct = await favouriteProduct_model.findOne({
      productId: product._id,
      userId: req.user.id,
    });
    if (favouriteProduct) {
      product.isFavourite = true;
    } else {
      product.isFavourite = false;
    }
    return product;
  });
  products = await Promise.all(products);
  return successMessage(200, res, "All products", products);
});

// method put
// route /api/v1/product/:id
// @privacy only user can do this
const updateProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (product.userId.toString() !== req.user.id) {
    return next(
      new AppError("You are not authorized because it is not you product", 403)
    );
  }
  const { error, value } = editProductValidationSchema.validate(req.body);
  if (error) {
    return successMessage(400, res, error.details[0].message);
  }
  if (value.categoryName) {
    const categoryExists = await category_model.findOne({
      categoryName: value.categoryName,
    });
    if (!categoryExists) {
      return successMessage(400, res, "Category does not exist");
    }
  }
  const { id } = req.params;
  if (!id) {
    return next(new AppError("Product ID is required in params", 400));
  }
  if (value.productImage && !value.productImage.length === 0) {
    value.productImage = await getFileName(value.productImage);
    // Get elements in value.productImage that are not in product.productImage
    const newProductImages = value.productImage.filter(
      (image) => !product.productImage.includes(image)
    );
    if (newProductImages.length !== 0) {
      const imageExists = await checkImageExists(newProductImages);
      if (!imageExists.every((exists) => exists)) {
        throw new AppError("Some images not exists in bucket", 400);
      }
      // Check if the new images are duplicates
      const duplicateProduct = await checkDuplicateAwsImgsInRecords(
        newProductImages,
        "productImage"
      );
      if (!duplicateProduct.success) {
        throw new AppError(duplicateProduct.message, 400);
      }
    }
  }
  // Get elements in product.productImage that are not in value.productImage
  const deletedProductImages = product.productImage.filter(
    (image) => !value.productImage.includes(image)
  );
  if (deletedProductImages.length !== 0) {
    // Delete images from S3 bucket
    await deleteObjects(deletedProductImages);
  }
  let updatedProduct = await Product.findByIdAndUpdate(
    id,
    {
      ...value,
      // if category is present, convert it to array
      ...(value.category && { category: [value.categoryName] }),
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!updatedProduct) {
    return next(new AppError("Product not found", 404));
  }

  const signUrl = await generateSignedUrl(updatedProduct.productImage);
  updatedProduct.productImage = signUrl;

  return successMessage(
    200,
    res,
    "Product updated successfully",
    updatedProduct
  );
});

// method delete
// route /api/v1/product/:id
// @privacy only user can do this
const deleteProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (product.userId.toString() !== req.user.id) {
    return next(
      new AppError("You are not authorized because it is not you product", 403)
    );
  }
  const productDeletion = await Product.findByIdAndDelete(req.params.id);
  if (!productDeletion) {
    return next(new AppError("Product not found", 404));
  }
  if (productDeletion.productImage.length !== 0) {
    await deleteObjects(productDeletion.productImage);
  }
  const searchAlertNotifications = await searchAlertNotification_model.find({
    productId: productDeletion._id,
  });
  const promise = searchAlertNotifications.map(
    async (searchAlertNotification) => {
      await searchAlertNotification_model.findByIdAndDelete(
        searchAlertNotification._id
      );
    }
  );
  await Promise.all(promise);

  return successMessage(202, res, "Product deleted successfully");
});

// method get
// route /api/v1/product/nearest
// @privacy only user can do this
const nearestProductsOrsearch = catchAsync(async (req, res, next) => {
  const { value, error } = filterProductJoiSchema.validate(req.body);
  if (error) {
    return successMessage(400, res, error.details[0].message);
  }
  const myProfile = await user_model.findById(req.user.id);
  const [longitude, latitude] = myProfile.location.coordinates;
  // within 10 km
  // user must not be req.user.id
  let user = await user_model.find({
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
        $maxDistance:
          (Number(value.searchRadius) ? Number(value.searchRadius) : 10) *
          1.60934 *
          1000,
      },
    },
    _id: { $ne: req.user.id },
  });
  let categories = [];
  if (value.category) {
    categories = value.category;
  } else if (
    !(
      value.searchTerm ||
      value.searchRadius ||
      (value.category && value.category.length > 0) ||
      (value.sort && (value.sort == 0 || value.sort == 1)) ||
      (value.price && (value.price.min || value.price.max))
    )
  ) {
    const customizeFeed = await customizeFeed_model.findOne({
      userId: req.user.id,
    });
    if (customizeFeed && customizeFeed.categories.length > 0) {
      categories = customizeFeed.categories;
    }
  }
  let productss = [];
  let products = user.map(async (user) => {
    const product = await Product.find({
      userId: user._id.toString(),
      // search product by searchTerm if searchTerm
      ...(value.searchTerm && {
        productName: { $regex: value.searchTerm, $options: "i" },
      }),
      ...(categories.length > 0 && {
        $or: [
          // category is categories
          { category: { $in: categories } },
        ].filter((condition) => condition !== undefined), // Filter out undefined conditions,
      }),
      // productPrice is between value.min and value.max
      ...(value.price &&
        value.price.min &&
        value.price.min >= 0 &&
        value.price.max &&
        value.price.max > 0 && {
          productPrice: {
            $gte: value.price.min,
            $lte: value.price.max + 1,
          },
        }),
    }).lean();
    productss.push(...product);
  });
  await Promise.all(products);
  // remove undefined value from products array
  products = productss.filter((product) => product);
  products = products.map(async (product) => {
    const signUrl = await generateSignedUrl(product.productImage);
    const favouriteProduct = await favouriteProduct_model.findOne({
      productId: product._id,
      userId: req.user.id,
    });
    if (favouriteProduct) {
      product.isFavourite = true;
    } else {
      product.isFavourite = false;
    }
    product.productImage = signUrl;
    return product;
  });
  products = await Promise.all(products);
  // sort by created at
  if (value.sort && value.sort == 1) {
    products = products.sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }

  return successMessage(200, res, "Nearest products", products);
});

// method get
// route /api/v1/product/:id
// @privacy only user can do this
// get product by id
const getProductById = catchAsync(async (req, res, next) => {
  let product = await Product.findById(req.params.id).lean();
  if (!product) {
    return next(new AppError("Product not found", 400));
  }
  let [user, otherProducts, relatedItems] = await Promise.all([
    user_model.findById(product.userId),
    Product.find({
      userId: product.userId,
      _id: { $ne: product._id },
      category: { $ne: product.category },
    }).lean(),
    Product.find({
      userId: product.userId,
      _id: { $ne: product._id },
      category: product.category,
    }).lean(),
  ]);
  otherProducts = otherProducts.map(async (product) => {
    const signUrl = await generateSignedUrl(product.productImage);
    product.productImage = signUrl;
    const favouriteProduct = await favouriteProduct_model.findOne({
      productId: product._id,
      userId: req.user.id,
    });
    if (favouriteProduct) {
      product.isFavourite = true;
    } else {
      product.isFavourite = false;
    }
    return product;
  });
  relatedItems = relatedItems.map(async (product) => {
    const signUrl = await generateSignedUrl(product.productImage);
    product.productImage = signUrl;
    const favouriteProduct = await favouriteProduct_model.findOne({
      productId: product._id,
      userId: req.user.id,
    });
    if (favouriteProduct) {
      product.isFavourite = true;
    } else {
      product.isFavourite = false;
    }
    return product;
  });
  [otherProducts, relatedItems] = await Promise.all([
    Promise.all(otherProducts),
    Promise.all(relatedItems),
  ]);
  product = JSON.parse(JSON.stringify(product));
  product.location = user.location;
  product.userName = user.name;
  if (user.userImage) {
    const signUrl = await generateSignedUrl([user.userImage]);
    product.userImage = signUrl[0];
  } else {
    product.userImage = null;
  }
  product.otherProducts = otherProducts;
  product.relatedItems = relatedItems;
  const productSeen = await productSeen_model.findOne({
    userId: req.user.id,
    productId: product._id,
  });
  if (!productSeen) {
    await productSeen_model.create({
      userId: req.user.id,
      productId: product._id,
    });
  }
  const productSeenNow = await productSeen_model
    .find({ productId: product._id })
    .countDocuments();
  return successMessage(202, res, "Product", {
    ...product,
    productSeen: productSeenNow,
  });
});

// method post
// route /api/v1/product/favourite/:id
// @privacy only user can do this
// like dislike product
const likeDislikeProduct = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const product = await Product.findById(id);
  if (!product) {
    return next(new AppError("Product not found", 404));
  }
  const favouriteProduct = await favouriteProduct_model.findOne({
    productId: id,
    userId: req.user.id,
  });
  if (favouriteProduct) {
    await favouriteProduct_model.findByIdAndDelete(favouriteProduct._id);
    return successMessage(200, res, "Product removed from favourite");
  }
  await favouriteProduct_model.create({
    productId: id,
    userId: req.user.id,
  });
  return successMessage(200, res, "Product added to favourite");
});

// method get
// route /api/v1/product/favourite
// @privacy only user can do this
// get all favourite products
const getFavouriteProducts = catchAsync(async (req, res, next) => {
  let favouriteProducts = await favouriteProduct_model.find({
    userId: req.user.id,
  });
  favouriteProducts = favouriteProducts.map(async (favouriteProduct) => {
    const product = await Product.findById(favouriteProduct.productId).lean();
    const signUrl = await generateSignedUrl(product.productImage);
    product.productImage = signUrl;
    product.isFavourite = true;
    return product;
  });
  favouriteProducts = await Promise.all(favouriteProducts);
  return successMessage(200, res, "Favourite products", favouriteProducts);
});

// method post
// route /api/v1/product/changeProductStatus/
// @privacy only user can do this
// change product status
const changeProductStatus = catchAsync(async (req, res, next) => {
  const { error, value } = editProductStatusValidation.validate(req.body);
  if (error) {
    return successMessage(400, res, error.details[0].message);
  }
  const product = await Product.findById(value.productId);
  if (product.userId.toString() !== req.user.id) {
    return next(
      new AppError("You are not authorized because it is not you product", 400)
    );
  }
  if (!product) {
    return next(new AppError("Product not found", 404));
  }
  if (value.productStatus == product.productStatus) {
    return successMessage(200, res, "Product status already updated", product);
  }
  if (value.productStatus == 2) {
    if (!value.clientId) {
      return next(new AppError("Client ID is required", 400));
    }
    const chat = await chat_model.find({
      receiverId: req.user.id,
      senderId: value.clientId,
    });
    if (chat.length == 0) {
      return next(new AppError("you not do chat with this person", 400));
    }
    const sale = await sale_model.create({
      ownerId: req.user.id,
      productId: value.productId,
      clientId: value.clientId,
      quantity: 1,
      productPrice: product.productPrice,
    });
    product.productStatus = value.productStatus;
    await product.save();
    return successMessage(
      200,
      res,
      "Product status updated successfully",
      product
    );
  }
  product.productStatus = value.productStatus;
  await product.save();
  const signUrl = await generateSignedUrl(product.productImage);
  product.productImage = signUrl;
  return successMessage(
    200,
    res,
    "Product status updated successfully",
    product
  );
});

// method get
// route /api/v1/product/getClients/forSell
// @privacy only user can do this
// get all clients for sell
const getClientsforSell = catchAsync(async (req, res, next) => {
  let clients = await chat_model
    .find({ receiverId: req.user.id })
    .distinct("senderId");
  // fetch name email
  clients = await user_model
    .find({ _id: { $in: clients } })
    .select("name email userImage");
  clients = clients.map(async (client) => {
    const signUrl = await generateSignedUrl([client.userImage]);
    client.userImage = signUrl[0];
    return client;
  });
  clients = await Promise.all(clients);
  return successMessage(200, res, "All clients for sell", clients);
});

// method get
// route /api/v1/product/topSelling/items
// @privacy only user can do this
// get top selling items
const getTopSellingItems = catchAsync(async (req, res, next) => {
  const customizeFeed = await customizeFeed_model.findOne({
    userId: req.user.id,
  });
  let categories = [];
  if (customizeFeed && customizeFeed.categories.length > 0) {
    categories = customizeFeed.categories;
  }
  let products = await sale_model.aggregate([
    {
      $group: {
        _id: "$productId",
        totalSale: { $sum: "$quantity" },
      },
    },
    {
      $sort: { totalSale: -1 },
    },
  ]);
  products = products.map(async (product) => {
    const productDetails = await Product.findOne({
      _id: product._id,
      productStatus: "0",
    }).lean();
    if (!productDetails) return;
    if (productDetails.userId.toString() === req.user.id) return;
    const signUrl = await generateSignedUrl(productDetails.productImage);
    productDetails.productImage = signUrl;
    const favouriteProduct = await favouriteProduct_model.findOne({
      productId: productDetails._id,
      userId: req.user.id,
    });
    if (favouriteProduct) {
      productDetails.isFavourite = true;
    } else {
      productDetails.isFavourite = false;
    }
    productDetails.totalSale = product.totalSale;
    return productDetails;
  });
  products = await Promise.all(products);
  // remove undefined
  products = products.filter((product) => product);
  if (categories.length > 0) {
    products = products.filter((product) => {
      return product.category.some((item) =>
        categories.some((element) => element.includes(item))
      );
    });
  }

  return successMessage(200, res, "Top selling items", products);
});

// method get
// route /api/v1/product/purchase/history
// @privacy only user can do this
// get purchase history
const getPurchaseHistory = catchAsync(async (req, res, next) => {
  let purchaseHistory = await sale_model
    .find({
      clientId: req.user.id,
    })
    .sort({ createdAt: -1 });
  purchaseHistory = purchaseHistory.map(async (purchase) => {
    const product = await Product.findById(purchase.productId).lean();
    const signUrl = await generateSignedUrl([product.productImage]);
    product.productImage = signUrl[0];
    const favouriteProduct = await favouriteProduct_model.findOne({
      productId: product._id,
      userId: req.user.id,
    });
    if (favouriteProduct) {
      product.isFavourite = true;
    } else {
      product.isFavourite = false;
    }
    return product;
  });
  purchaseHistory = await Promise.all(purchaseHistory);
  return successMessage(200, res, "Purchase history", purchaseHistory);
});

// method get
// route /api/v1/product/admin/getProducts
// @privacy only admin can do this
// get all products for admin
const getAllProductsForAdmin = catchAsync(async (req, res, next) => {
  let products = await Product.find().lean();
  products = products.map(async (product) => {
    const signUrl = await generateSignedUrl(product.productImage);
    product.productImage = signUrl;
    return product;
  });
  products = await Promise.all(products);
  return successMessage(200, res, "All products", products);
});

// method get
// route /api/v1/product/admin/getProduct/:id
// @privacy only admin can do this
// get product by id for admin
const getProductByIdForAdmin = catchAsync(async (req, res, next) => {
  let product;
  if (req.params.id) {
    product = await Product.findById(req.params.id).lean();
  } else {
    return next(new AppError("Product ID is required in params", 400));
  }
  if (!product) {
    return next(new AppError("Product not found", 400));
  }
  if (product.productImage.length > 0) {
    const signUrl = await generateSignedUrl(product.productImage);
    product.productImage = signUrl;
  }
  product = JSON.parse(JSON.stringify(product));
  const sale = await sale_model
    .find({ productId: product._id })
    .countDocuments();
  product.totalSale = sale;
  return successMessage(202, res, "Product", product);
});

module.exports = {
  createProduct,
  getAllProducts,
  updateProduct,
  deleteProduct,
  nearestProductsOrsearch,
  getProductById,
  likeDislikeProduct,
  getFavouriteProducts,
  changeProductStatus,
  getClientsforSell,
  getTopSellingItems,
  getPurchaseHistory,
  getAllProductsForAdmin,
  getProductByIdForAdmin,
};
