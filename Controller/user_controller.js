// catch async
const catchAsync = require("../utils/catchAsync");
// email
const Email = require("../utils/emails.js");
// model
const user_model = require("../Model/user_model");
// const run = async () => {
//   await user_model.updateMany({}, { $set: { socketId: [] } });
// };
// run();
const customizeFeed_model = require("../Model/customizeFeed_model");
const category_model = require("../Model/category_model");
const searchAlert_model = require("../Model/searchAlert_model");
const review_model = require("../Model/review_model");
const product_model = require("../Model/product_model");
const searchAlertNotification_model = require("../Model/searchAlertNotification_model");
const activeNotification_model = require("../Model/activeNotification_model");
// utility functions
const {
  successMessage,
  decryptAndValidateOtp,
  generateRandomNumber,
  generateEncryptedOtp,
  validateOtpExpiration,
  checkDuplicateAwsImgInRecords,
  sendFirbaseNotification,
} = require("../functions/utility_functions");
// encryption
const CryptoJS = require("crypto-js");
// app error
const AppError = require("../utils/appError");
// joi validation
const {
  signUpUserValidation,
  editUserValidation,
  editCustomizeFeedSchema,
  searchAlertValidationSchema,
  reviewValidationSchema,
  filterProductJoiSchema,
} = require("../utils/joi_validator");
const {
  generateAccessTokenRefreshToken,
} = require("../utils/verifyToken_util");
const {
  checkImageExists,
  generateSignedUrl,
  deleteObjects,
  getFileName,
} = require("../utils/aws.js");

// method post
// route /api/v1/user
// @desc login orsignup the user
const SignupUser = catchAsync(async (req, res, next) => {
  // Validate request body against the schema
  const { error, value } = signUpUserValidation.validate(req.body);

  // Check for validation errors
  if (error) {
    // If validation fails, respond with the validation error
    return res.status(400).json({ error: error.details[0].message });
  }
  const user = await user_model.findOne({ email: value.email });
  if (user) {
    if (user.isBlocked) {
      return next(new AppError("You are blocked by admin", 400));
    }
    if (!user.verified) {
      const otp = generateRandomNumber(4);
      const encryptedOtp = generateEncryptedOtp(otp, 5, value.email);
      await user_model
        .findOneAndUpdate(
          { email: value.email },
          {
            password: CryptoJS.AES.encrypt(
              value.password,
              process.env.CRYPTO_SEC
            ).toString(),
            phoneNumber: value.phoneNumber,
            location: value.location ? value.location : null,
            otp: encryptedOtp,
            name: value.name,
          },
          { new: true } // Optionally, to return the updated document instead of the original one
        )
        .select("-refreshToken -otp");
      await new Email(
        { email: value.email, name: "" },
        otp
      ).sendVerificationCode();
      return successMessage(
        202,
        res,
        "verification otp is sent to your email",
        null
      );
    }
    if (user.verified) {
      return next(new AppError("User already exist", 400));
    }
  } else {
    const otp = generateRandomNumber(4);
    const encryptedOtp = generateEncryptedOtp(otp, 5, value.email);
    await user_model.create({
      email: value.email,
      password: CryptoJS.AES.encrypt(
        value.password,
        process.env.CRYPTO_SEC
      ).toString(),
      name: value.name,
      phoneNumber: value.phoneNumber,
      location: value.location,
      otp: encryptedOtp,
    });
    await new Email(
      { email: value.email, name: "" },
      otp
    ).sendVerificationCode();
    return successMessage(
      202,
      res,
      "otp sent to you email verify account",
      null
    );
  }
});
// method post
// route /api/v1/user/verify
// @desc verify the user
const verifyUser = catchAsync(async (req, res, next) => {
  const { code, email } = req.body;
  const user = await user_model.findOne({ email });
  if (!user) {
    return next(new AppError("User not found", 400));
  }
  if (!user.otp) {
    return next(new AppError("Generate otp first", 400));
  }
  const { otp, expirationTime, email: em } = decryptAndValidateOtp(user.otp);
  validateOtpExpiration(expirationTime);
  console.log(em, email);
  if (em !== user.email) {
    return next(new AppError("This is not your otp", 400));
  }
  if (otp == code) {
    const { refreshToken, accessToken } = generateAccessTokenRefreshToken(
      user._id
    );
    const editUser = await user_model.findOneAndUpdate(
      { _id: user._id },
      {
        verified: true,
        otp: null,
        $push: { refreshToken: refreshToken },
      },
      { new: true }
    );
    const {
      refreshToken: ref,
      password: pwd,
      ...restUser
    } = JSON.parse(JSON.stringify(editUser));
    return successMessage(202, res, "user verified", {
      ...restUser,
      accessToken,
      refreshToken,
    });
  } else {
    return next(new AppError("Invalid otp", 400));
  }
});
// method POST
// route /api/v1/user/login
// @desc login user
const loginUser = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  const user = await user_model.findOne({ email: email });
  if (!user) {
    return next(new AppError("Invalid Credentials", 400));
  }
  if (!user.verified) {
    return next(new AppError("You are not signup", 400));
  }
  if (user.isBlocked) {
    return next(new AppError("You are blocked by admin", 400));
  }
  if (user.isDeleted) {
    return next(new AppError("User is deleted", 400));
  }
  const bytes = CryptoJS.AES.decrypt(user.password, process.env.CRYPTO_SEC);
  const originalText = bytes.toString(CryptoJS.enc.Utf8);
  if (originalText !== password) {
    return next(new AppError("Invalid password", 400));
  }
  const { refreshToken, accessToken } = generateAccessTokenRefreshToken(
    user._id
  );
  const editUser = await user_model.findOneAndUpdate(
    { _id: user._id },
    { $push: { refreshToken: refreshToken } }
  );
  let {
    refreshToken: ref,
    password: pwd,
    otp,
    fcm_key,
    ...restUser
  } = JSON.parse(JSON.stringify(editUser));
  if (restUser.userImage) {
    const userImage = await generateSignedUrl([restUser.userImage]);
    restUser = { ...restUser, userImage: userImage[0] };
  }
  return successMessage(202, res, "user verified", {
    ...restUser,
    accessToken,
    refreshToken,
  });
});

// method POST
// route /api/v1/user/logout
// @desc logout user
const logoutUser = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.body;
  const updateUser = await user_model.findOneAndUpdate(
    { refreshToken: refreshToken },
    { $pull: { refreshToken: refreshToken } }
  );
  if (!updateUser) {
    return next(new AppError("Invalid Credentials", 400));
  }
  return successMessage(202, res, "Logout Success", null);
});

// method PUT
// route /api/v1/user/
// @desc update user
const updateUser = catchAsync(async (req, res, next) => {
  const { error, value } = editUserValidation.validate(req.body);
  const user = await user_model.findOne({ _id: req.user.id });
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  if (value.userImage) {
    value.userImage = getFileName([value.userImage]);
    value.userImage = value.userImage[0];
    const exists = await checkImageExists([value.userImage]);
    if (!exists[0]) {
      return next(new AppError("Image not exists in bucket", 400));
    }
  }
  if (value.userImage && value.userImage !== user.userImage) {
    const result = await checkDuplicateAwsImgInRecords(
      value.userImage,
      "userImage"
    );
    if (result.success === false) {
      return next(new AppError(result.message, 400));
    }
  }
  const editUser = await user_model.findOneAndUpdate(
    { _id: req.user.id },
    value,
    { new: true }
  );
  if (editUser.userImage !== user.userImage) {
    await deleteObjects([user.userImage]);
  }
  const { refreshToken, password, fcm_key, ...restUser } = JSON.parse(
    JSON.stringify(editUser)
  );
  return successMessage(202, res, "user updated", restUser);
});

// method get
// route /api/v1/user/
// @desc get user profile
// only for authenticated user
const getUser = catchAsync(async (req, res, next) => {
  const user = await user_model.findOne({ _id: req.user.id });
  if (!user) {
    return next(new AppError("User not found", 400));
  }
  const { refreshToken, password, fcm_key, ...restUser } = JSON.parse(
    JSON.stringify(user)
  );
  const signUrl = await generateSignedUrl([restUser.userImage]);
  restUser.userImage = signUrl[0];
  return successMessage(202, res, "user profile fetched", restUser);
});

// method post
// route /api/v1/user/forgot
// @desc forgot password
const forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  const user = await user_model.findOne({ email });
  if (!user) {
    return next(new AppError("User not found", 400));
  }
  if (!user.verified) {
    return next(new AppError("You are not signup", 400));
  }
  const otp = generateRandomNumber(4);
  const encryptedOtp = generateEncryptedOtp(otp, 5, email);
  await user_model.findOneAndUpdate(
    { email },
    {
      otp: encryptedOtp,
    },
    { new: true }
  );
  await new Email({ email, name: "" }, otp).sendVerificationCode();
  return successMessage(202, res, "otp sent to you email verify account", null);
});

// method post
// route /api/v1/user/resetPassword
// @desc reset password
const resetPassword = catchAsync(async (req, res, next) => {
  const { email, code, password } = req.body;
  const user = await user_model.findOne({ email });
  if (!user) {
    return next(new AppError("User not found", 400));
  }
  if (!user.verified) {
    return next(new AppError("You are not signup", 400));
  }
  if (!user.otp) {
    return next(new AppError("Generate otp first", 400));
  }
  const { otp, expirationTime, email: em } = decryptAndValidateOtp(user.otp);
  validateOtpExpiration(expirationTime);
  if (em !== user.email) {
    return next(new AppError("This is not your otp", 400));
  }
  if (otp == code) {
    const editUser = await user_model.findOneAndUpdate(
      { email },
      {
        password: CryptoJS.AES.encrypt(
          password,
          process.env.CRYPTO_SEC
        ).toString(),
        otp: null,
      },
      { new: true }
    );
    return successMessage(202, res, "password reset", null);
  } else {
    return next(new AppError("Invalid otp", 400));
  }
});

// method post
// route /api/v1/user/fcm
// @desc update fcm key
const updateFcm = catchAsync(async (req, res, next) => {
  const { fcm_key } = req.body;
  const userFcm = await user_model.findOne({ fcm_key });
  if (userFcm) {
    return successMessage(202, res, "fcm key already added", null);
  }
  const user = await user_model.findOneAndUpdate(
    { _id: req.user.id },
    { $push: { fcm_key: fcm_key } },
    { new: true }
  );
  if (!user) {
    return next(new AppError("User not found", 400));
  }
  return successMessage(202, res, "fcm key added", null);
});

// method post
// route /api/v1/user/customizeFeed
// @desc customize feed
const customizeFeed = catchAsync(async (req, res, next) => {
  const { error, value } = editCustomizeFeedSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  const user = await user_model.findOne({ _id: req.user.id });
  if (!user) {
    return next(new AppError("User not found", 400));
  }
  const feed = await customizeFeed_model.findOne({ userId: req.user.id });
  if (feed) {
    if (value.categories && value.categories.length > 0) {
      const result = await value.categories.map(async (category) => {
        const cat = await category_model.find({ categoryName: category });
        if (cat.length === 0) {
          return next(
            new AppError(`Category:${category} not an admin category`, 400)
          );
        }
      });
      await Promise.all(result);
    }
    const editFeed = await customizeFeed_model.findOneAndUpdate(
      { userId: req.user.id },
      { ...value },
      { new: true }
    );
    return successMessage(202, res, "feed customized", editFeed);
  } else {
    if (value.categories && value.categories.length > 0) {
      const result = await value.categories.map(async (category) => {
        const cat = await category_model.find({ categoryName: category });
        if (cat.length === 0) {
          return next(
            new AppError(`Category:${category} not an admin category`, 400)
          );
        }
      });
      await Promise.all(result);
    }
    const createFeed = await customizeFeed_model.create({
      userId: req.user.id,
      ...value,
    });
    return successMessage(202, res, "feed customized", createFeed);
  }
});

// method get
// route /api/v1/user/customizeFeed
// @desc get customize feed
const getCustomizeFeed = catchAsync(async (req, res, next) => {
  const feed = await customizeFeed_model.findOne({ userId: req.user.id });
  if (!feed) {
    return next(new AppError("Feed not found", 400));
  }
  return successMessage(202, res, "feed fetched", feed);
});

// method post
// route /api/v1/user/searchAlert
// @desc create search alert
const createSearchAlert = catchAsync(async (req, res, next) => {
  const { error, value } = searchAlertValidationSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  const alert = await searchAlert_model.findOne({ userId: req.user.id });
  if (alert) {
    const editAlert = await searchAlert_model.findOneAndUpdate(
      { userId: req.user.id },
      { ...value },
      { new: true }
    );
    return successMessage(202, res, "alert updated", editAlert);
  } else {
    const createAlert = await searchAlert_model.create({
      userId: req.user.id,
      ...value,
    });
    return successMessage(202, res, "alert created", createAlert);
  }
});

// method get
// route /api/v1/user/searchAlert
// @desc get search alert
const getSearchAlert = catchAsync(async (req, res, next) => {
  const alert = await searchAlert_model.findOne({ userId: req.user.id });
  if (!alert) {
    return next(new AppError("Alert not found", 400));
  }
  return successMessage(202, res, "alert fetched", alert);
});

// method post
// route /api/v1/user/review
// @desc review user
const reviewUser = catchAsync(async (req, res, next) => {
  const { error, value } = reviewValidationSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  const user = await user_model.findOne({ _id: req.user.id });
  if (!user) {
    return next(new AppError("User not found", 400));
  }
  const saller = await user_model.findOne({ _id: value.sallerId });
  if (!saller) {
    return next(new AppError("Saller not found", 400));
  }
  const reviewFound = await review_model.findOne({
    buyerId: req.user.id,
    sallerId: value.sallerId,
  });
  if (req.user.id == value.sallerId) {
    return next(new AppError("You can't review yourself", 400));
  }
  let review;
  if (reviewFound) {
    review = await review_model.findOneAndUpdate(
      { buyerId: req.user.id, sallerId: value.sallerId },
      { ...value },
      { new: true }
    );
  } else {
    review = await review_model.create({
      buyerId: req.user.id,
      ...value,
    });
  }
  const activeNotification = await activeNotification_model.create({
    receiverId: review.sallerId,
    message: `You have a new review from ${saller.name} with message ${review.comment} and ${review.stars} stars`,
  });
  if (saller.fcm_key.length > 0) {
    const data = {
      notification: {
        title: "active Notification",
        body: {
          message: activeNotification.message,
        },
      },
      data: {
        title: "active Notification",
        body: {
          message: activeNotification.message,
        },
      },
      registration_ids: saller.fcm_key,
    };

    await sendFirbaseNotification(data, process.env.fireBaseServerKey);
  }
  return successMessage(202, res, "review created", review);
});

// method get
// route /api/v1/user/review
// @desc get review
// all can do this
const getReview = catchAsync(async (req, res, next) => {
  const { sallerId } = req.query;
  // saller id must be objectId
  if (!sallerId) {
    return next(new AppError("SallerId is required", 400));
  }
  const isObjectId = sallerId.match(/^[0-9a-fA-F]{24}$/);
  if (!isObjectId) {
    return next(new AppError("Invalid sallerId", 400));
  }
  const review = await review_model.find({ sallerId });
  if (!review) {
    return next(new AppError("Review not found", 400));
  }
  return successMessage(202, res, "review fetched", review);
});

// method get
// route /api/v1/user/all
// @desc get all users
// only for admin
const getAllUsers = catchAsync(async (req, res, next) => {
  const { isBlocked = false } = req.query;
  let users = await user_model
    .find({ isBlocked })
    .sort({ createdAt: -1 })
    .select("-password -refreshToken -otp")
    .lean();
  users = users.map(async (user) => {
    if (user.userImage) {
      const signUrl = await generateSignedUrl([user.userImage]);
      user.userImage = signUrl[0];
    }
    const products = await product_model
      .find({ userId: user._id })
      .countDocuments();
    user.listings = products;
    return user;
  });
  users = await Promise.all(users);
  return successMessage(202, res, "all users", users);
});

// method get
// route /api/v1/user/info
// @desc get user info
// only for admin
const getUserInfo = catchAsync(async (req, res, next) => {
  const { userId } = req.query;
  if (!userId) {
    return next(new AppError("userId is required", 400));
  }
  const user = await user_model
    .findOne({ _id: userId })
    .select("-password -refreshToken -otp")
    .lean();
  if (!user) {
    return next(new AppError("User not found", 400));
  }
  let products = await product_model
    .find({ userId: userId })
    .sort({ createdAt: -1 })
    .lean();
  products = products.map(async (product) => {
    if (product.productImage) {
      const signUrl = await generateSignedUrl([product.productImage]);
      product.productImage = signUrl[0];
    }
    return product;
  });
  products = await Promise.all(products);
  user.listings = products.length;
  const reviews = await review_model
    .find({ sallerId: userId })
    .sort({ createdAt: -1 })
    .lean();

  return successMessage(202, res, "user info", { user, products, reviews });
});

// method get
// route /api/v1/user/block
// @desc get user info
// only for admin
const blockUser = catchAsync(async (req, res, next) => {
  const { userId } = req.query;
  if (!userId) {
    return next(new AppError("userId is required", 400));
  }
  const user = await user_model.findById(userId);
  if (!user) {
    return next(new AppError("User not found", 400));
  }
  user.isBlocked = !user.isBlocked;
  await user.save();
  if (user.isBlocked) {
    return successMessage(202, res, "user blocked", null);
  }
  return successMessage(202, res, "user unblocked", null);
});

// method get
// route /api/v1/user/searchAlertNotification
// @desc get search alert notification
const getSearchAlertNotification = catchAsync(async (req, res, next) => {
  const receiverId = req.user.id;
  const receiver = await user_model.findById(receiverId);
  if (!receiverId) {
    return next(new AppError("userId is required", 400));
  }
  let alerts = await searchAlertNotification_model
    .find({
      receiverId,
      createdAt: { $gte: receiver.createdAt },
    })
    .sort({ createdAt: -1 })
    .lean();
  if (alerts.length === 0) {
    return successMessage(202, res, "search alert notification", alerts);
  }
  alerts = alerts.map(async (alert) => {
    const product = await product_model
      .findOne({ _id: alert.productId })
      .lean();
    const signUrl = await generateSignedUrl(product.productImage);
    alert.productImage = signUrl;
    alert.productName = product.productName;
    alert.productDescription = product.productDescription;
    return alert;
  });
  alerts = await Promise.all(alerts);
  return successMessage(202, res, "search alert notification", alerts);
});

// method get
// route /api/v1/user/activeNotification
// @desc get active notification
const getActiveNotification = catchAsync(async (req, res, next) => {
  const receiverId = req.user.id;
  const receiver = await user_model.findById(receiverId);
  if (!receiverId) {
    return next(new AppError("userId is required", 400));
  }
  let notifications = await activeNotification_model
    .find({
      $or: [{ receiverId: receiverId }, { receiverId: null }],
      createdAt: { $gte: receiver.createdAt },
    })
    .sort({ createdAt: -1 })
    .lean();
  return successMessage(202, res, "active notification", notifications);
});

module.exports = {
  SignupUser,
  verifyUser,
  loginUser,
  logoutUser,
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
};
