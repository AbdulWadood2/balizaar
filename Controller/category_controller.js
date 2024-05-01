// models
const product_model = require("../Model/product_model");
const category_model = require("../Model/category_model");
const user_model = require("../Model/user_model");
const customizeFeed_model = require("../Model/customizeFeed_model");
// catch async
const catchAsync = require("../utils/catchAsync");
// app error
const AppError = require("../utils/appError");

const {
  createCategoryValidation,
  editCategoryValidation,
} = require("../utils/joi_validator");
const {
  successMessage,
  checkDuplicateAwsImgInRecords,
} = require("../functions/utility_functions");
const {
  generateSignedUrl,
  deleteObjects,
  checkImageExists,
  getFileName,
} = require("../utils/aws");
// method post
// route /api/v1/category/
// @privacy admin can do this with their auth token
// create a category
const createCategory = catchAsync(async (req, res, next) => {
  const { error, value } = createCategoryValidation.validate(req.body);
  if (error) {
    return next(new AppError(400, error.details[0].message));
  }
  // check if category already exists
  const categoryExists = await category_model.findOne({
    categoryName: value.categoryName,
  });
  if (categoryExists) {
    return next(new AppError("Category already exists", 400));
  }
  // check if image exists
  const imageExists = await checkImageExists([value.categoryImage]);
  if (!imageExists[0]) {
    return next(new AppError("Category image does not exist", 400));
  }
  // check duplicate images
  const duplicateImages = await checkDuplicateAwsImgInRecords(
    value.categoryImage,
    "categoryImage"
  );
  if (!duplicateImages.success) {
    return next(new AppError(duplicateImages.message, 400));
  }
  // create category
  let category = await category_model.create({
    categoryName: value.categoryName,
    categoryImage: value.categoryImage,
  });
  // generate sign url
  const signedUrl = await generateSignedUrl([category.categoryImage]);
  category.categoryImage = signedUrl[0];
  return successMessage(202, res, "Category created", category);
});

// method put
// route /api/v1/category/:id
// @privacy admin can do this with their auth token
// update a category
const updateCategory = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { error, value } = editCategoryValidation.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }
  // check if category exists
  const category = await category_model.findById(id);
  if (!category) {
    return next(new AppError("Category does not exist", 400));
  }
  // check if image exists
  if (value.categoryImage) {
    value.categoryImage = getFileName([value.categoryImage]);
    value.categoryImage = value.categoryImage[0];
    if (value.categoryImage !== category.categoryImage) {
      const imageExists = await checkImageExists([value.categoryImage]);
      if (!imageExists[0]) {
        return next(new AppError("Category image does not exist", 400));
      }
      // check duplicate images
      const duplicateImages = await checkDuplicateAwsImgInRecords(
        value.categoryImage,
        "categoryImage"
      );
      if (!duplicateImages.success) {
        return next(new AppError(duplicateImages.message, 400));
      }
      // delete old image
      await deleteObjects([category.categoryImage]);
    }
  }
  if (category.categoryName !== value.categoryName) {
    const CATEGORY = await category_model.findOne({
      categoryName: value.categoryName,
    });
    if (CATEGORY) {
      return next(new AppError("Category already exists", 400));
    }
  }
  // update category
  const updatedCategory = await category_model.findByIdAndUpdate(
    id,
    {
      ...value,
    },
    { new: true }
  );
  // generate sign url
  const signedUrl = await generateSignedUrl([updatedCategory.categoryImage]);
  updatedCategory.categoryImage = signedUrl[0];
  return successMessage(202, res, "Category updated", updatedCategory);
});

// method delete
// route /api/v1/category/:id
// @privacy admin can do this with their auth token
// delete a category
const deleteCategory = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  // check if category exists
  const category = await category_model.findById(id);
  if (!category) {
    return next(new AppError("Category does not exist", 400));
  }
  // delete category
  await category_model.findByIdAndDelete(id);
  // update all customize feeds and pull the categoryName
  await customizeFeed_model.updateMany(
    { categories: category.categoryName },
    { $pull: { categories: category.categoryName } }
  );
  // delete image
  await deleteObjects([category.categoryImage]);
  return successMessage(202, res, "Category deleted", null);
});

// method get
// route /api/v1/category/
// @privacy all can do this with their auth token
// get all categories
const getAllCategories = catchAsync(async (req, res, next) => {
  const categories = await category_model.find();
  // generate sign url
  const signedUrl = await generateSignedUrl(
    categories.map((category) => category.categoryImage)
  );
  categories.forEach((category, index) => {
    category.categoryImage = signedUrl[index];
  });
  return successMessage(200, res, "All categories", categories);
});

// method get
// route /api/v1/category/
// @privacy all can do this with their auth token
// get other categories
const getOtherCategories = catchAsync(async (req, res, next) => {
  const user = await user_model.findById(req.user.id);
  const categories = await category_model.find();
  const [longitude, latitude] = user.location.coordinates;
  const users = await user_model
    .find(
      // that not req.user.id
      {
        _id: { $ne: req.user.id },
        // that are nearest to req.user
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [longitude, latitude],
            },
            $maxDistance: 40075 * 1000,
          },
        },
      }
    )
    .select("-password");
  let products = users.map(async (user) => {
    const products = await product_model.find({
      userId: user._id,
      // not the categoryName that already have in category records categoryName
      category: { $nin: categories.map((category) => category.categoryName) },
    });
    return products[0];
  });
  products = await Promise.all(products);
  // remove undefined
  products = products.filter((product) => product);
  // sort new to old
  products.sort((a, b) => b.createdAt - a.createdAt);
  // signUrl
  products = products.map(async (product) => {
    const signedUrl = await generateSignedUrl([product.productImage]);
    product.productImage = signedUrl[0];
    return product;
  });
  products = await Promise.all(products);
  return successMessage(200, res, "All products", products);
});

module.exports = {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getOtherCategories,
};
