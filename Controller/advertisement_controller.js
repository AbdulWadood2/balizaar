// catch async
const catchAsync = require("../utils/catchAsync.js");
// model
const advertisement_model = require("../Model/advertisement_model.js");
// utility functions
const { successMessage } = require("../functions/utility_functions.js");
// app error
const AppError = require("../utils/appError.js");
// joi validation
const {
  advertisementSchema,
  updateAdvertisementSchema,
} = require("../utils/joi_validator.js");
const {
  checkDuplicateAwsImgsInRecords,
} = require("../functions/utility_functions.js");
const {
  deleteObjects,
  checkImageExists,
  generateSignedUrl,
  getFileName,
} = require("../utils/aws.js");

// method post
// path: /api/v1/advertisement/
// only admin can access
// create advertisement
const createAdvertisement = catchAsync(async (req, res, next) => {
  const { error, value } = advertisementSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }
  const duplicateImages = await checkDuplicateAwsImgsInRecords(
    value.images,
    "images"
  );
  const images = await checkImageExists(value.images);
  if (images.includes(false)) {
    return next(new AppError("Image does not exist", 400));
  }
  if (!duplicateImages.success) {
    return next(new AppError(duplicateImages.message, 400));
  }
  const advertisement = await advertisement_model.create(value);
  advertisement.images = await generateSignedUrl(advertisement.images);
  return successMessage(202, res, "Advertisement created", advertisement);
});

// method get
// path: /api/v1/advertisement/
// get all advertisements
// all users can access
const getAdvertisements = catchAsync(async (req, res, next) => {
  let advertisements = await advertisement_model.find();

  advertisements = advertisements.map(async (advertisement) => {
    advertisement.images = await generateSignedUrl(advertisement.images);
    return advertisement;
  });
  advertisements = await Promise.all(advertisements);

  return successMessage(200, res, "Advertisements retrieved", advertisements);
});

// method put
// path: /api/v1/advertisement/:id
// only admin can access
// update advertisement
const updateAdvertisement = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!id) {
    return next(new AppError("Id is required in params", 400));
  }
  const advertisement = await advertisement_model.findById(id);
  if (!advertisement) {
    return next(new AppError("Advertisement not found", 400));
  }
  let { error, value } = updateAdvertisementSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }
  if (value.images) {
    value.images = getFileName(value.images);
    if (value.images[0] !== advertisement.images[0]) {
      const exist = await checkImageExists(value.images);
      if (exist.includes(false)) {
        return next(new AppError("Image does not exist", 400));
      }
      const duplicateImages = await checkDuplicateAwsImgsInRecords(
        value.images,
        "images"
      );
      if (!duplicateImages.success) {
        return next(new AppError(duplicateImages.message, 400));
      }
      await deleteObjects(advertisement.images);
    }
  }
  const advertisementEdited = await advertisement_model.findByIdAndUpdate(
    id,
    value,
    { new: true }
  );
  advertisementEdited.images = await generateSignedUrl(advertisementEdited.images);
  return successMessage(200, res, "Advertisement updated", advertisementEdited);
});

// method delete
// path: /api/v1/advertisement/:id
// only admin can access
// delete advertisement
const deleteAdvertisement = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!id) {
    return next(new AppError("Id is required in params", 400));
  }
  const advertisement = await advertisement_model.findById(id);
  if (!advertisement) {
    return next(new AppError("Advertisement not found", 400));
  }
  await deleteObjects(advertisement.images);
  await advertisement_model.findByIdAndDelete(id);
  return successMessage(200, res, "Advertisement deleted");
});

module.exports = {
  createAdvertisement,
  getAdvertisements,
  updateAdvertisement,
  deleteAdvertisement,
};
