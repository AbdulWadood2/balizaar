// app error
const AppError = require("../utils/appError");
// model
const admin_model = require("../Model/admin_model");
// password encryption
const CryptoJS = require("crypto-js");
// model
const product_model = require("../Model/product_model");
const user_model = require("../Model/user_model");
const sales_model = require("../Model/sales_model");
const admindocs_model = require("../Model/admindocs_model");
const adminNotification_model = require("../Model/adminNotification_model");
const activeNotification_model = require("../Model/activeNotification_model");
// utility functions
const {
  successMessage,
  userPasswordCheck,
  generateRandomNumber,
  generateEncryptedOtp,
  decryptAndValidateOtp,
  validateOtpExpiration,
  checkDuplicateAwsImgInRecords,
  noTwoFilesEqual,
  sendFirbaseNotification,
} = require("../functions/utility_functions");
// catch async
const catchAsync = require("../utils/catchAsync");
const {
  generateAccessTokenRefreshToken,
} = require("../utils/verifyToken_util");
const Email = require("../utils/emails");
const {
  generateSignedUrl,
  checkImageExists,
  deleteObjects,
} = require("../utils/aws");
const {
  editDocumentsValidation,
  activeNotificationSchema,
} = require("../utils/joi_validator");
// method POST
// route /api/v1/admin/login
// @desc login admin
const loginAdmin = catchAsync(async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = await admin_model.findOne({ email: email });
  if (!user) {
    return next(new AppError("Invalid Credentials", 400));
  }
  // const isMatch = await bcrypt.compare(password, user.password);
  userPasswordCheck(user, password);
  const { refreshToken, accessToken } = generateAccessTokenRefreshToken(
    user._id
  );
  user.refreshToken.push(refreshToken);
  await user.save();
  const {
    refreshToken: ref,
    password: pwd,
    ...restUser
  } = JSON.parse(JSON.stringify(user));
  return successMessage(202, res, "Login Success", {
    ...restUser,
    accessToken: accessToken,
    refreshToken: refreshToken,
  });
});
// method POST
// route /api/v1/admin/logout
// @desc logout admin
const logoutAdmin = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.body;
  const updateUser = await admin_model.findOneAndUpdate(
    { refreshToken: refreshToken },
    { $pull: { refreshToken: refreshToken } }
  );
  if (!updateUser) {
    return next(new AppError("Invalid Credentials", 400));
  }
  return successMessage(202, res, "Logout Success", null);
});

// method POST
// route /api/v1/admin/forgot
// @desc forgot password
const forgotPassword = catchAsync(async (req, res, next) => {
  const email = req.body.email;
  const user = await admin_model.findOne({ email: email });
  if (!user) {
    return next(new AppError("not user with this email", 400));
  }
  const otp = generateRandomNumber(4);
  const encryptedOtp = generateEncryptedOtp(otp, 5, email);
  await admin_model.findOneAndUpdate({ email: email }, { otp: encryptedOtp });
  // send email
  await new Email({ email, name: "" }, otp).sendVerificationCode();
  return successMessage(202, res, "OTP sent to your email", null);
});

// method POST
// route /api/v1/admin/resetPassword
// @desc reset password
const resetPassword = catchAsync(async (req, res, next) => {
  const { email, code, password } = req.body;
  const user = await admin_model.findOne({ email: email });
  if (!user) {
    return next(new AppError("Invalid Credentials", 400));
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
    const editUser = await admin_model.findOneAndUpdate(
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

// method GET
// route /api/v1/admin/dashboard
// @desc dashboard
const dashboard = catchAsync(async (req, res, next) => {
  const currentYear = new Date().getFullYear();

  const [
    productsCount,
    usersCount,
    sellers,
    salesOfEachMonth,
    salesPerWeak,
    salesOfEachYear,
    topProducts,
  ] = await Promise.all([
    product_model.countDocuments(),
    user_model.countDocuments(),
    sales_model.aggregate([
      {
        $group: {
          _id: "$ownerId",
          total: { $sum: "$quantity" },
        },
      },
      {
        $sort: { total: -1 },
      },
    ]),
    sales_model.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(currentYear, 0, 1),
            $lt: new Date(currentYear, 11, 31),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          total: { $sum: { $multiply: ["$productPrice", "$quantity"] } },
        },
      },
    ]),
    // sales last 7 days
    sales_model.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(new Date().setDate(new Date().getDate() - 7)),
            $lt: new Date(),
          },
        },
      },
      {
        $group: {
          _id: { $dayOfWeek: "$createdAt" },
          total: { $sum: { $multiply: ["$productPrice", "$quantity"] } },
        },
      },
    ]),
    // sales of each year
    sales_model.aggregate([
      {
        $group: {
          _id: { $year: "$createdAt" },
          total: { $sum: { $multiply: ["$productPrice", "$quantity"] } },
        },
      },
    ]),
    sales_model.aggregate([
      {
        $group: {
          _id: "$productId",
          total: { $sum: "$quantity" },
        },
      },
      {
        $sort: { total: -1 },
      },
    ]),
  ]);
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const salesOfEachMonthData = monthNames.map((month, index) => {
    const monthData = salesOfEachMonth.find((month) => month._id === index + 1);
    return { month, total: monthData ? monthData.total : 0 };
  });
  const weakDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const salesPerWeakData = weakDays.map((day, index) => {
    const dayData = salesPerWeak.find((day) => day._id === index + 1);
    return { day, total: dayData ? dayData.total : 0 };
  });
  const salesOfEachYearData = salesOfEachYear
    .map((year) => {
      return { year: year._id, total: year.total };
    })
    .sort((a, b) => a.year - b.year);

  const sellersData = await Promise.all(
    sellers.map(async (seller) => {
      const user = await user_model
        .findById(seller._id)
        .lean()
        .select("-refreshToken -password -otp");
      const signUrl = await generateSignedUrl([user.userImage]);
      user.userImage = signUrl[0];
      user.quantity = seller.total;
      return user;
    })
  );

  const topProductsData = await Promise.all(
    topProducts.map(async (product) => {
      const productData = await product_model
        .findById(product._id)
        .lean()
        .select("-ownerId -__v");
      const signUrl = await generateSignedUrl(productData.productImage);
      productData.productImage = signUrl;
      productData.quantity = product.total;
      return productData;
    })
  );

  return successMessage(200, res, "Dashboard", {
    products: productsCount,
    user: usersCount,
    TopSellers: sellersData,
    salesOfEachMonth: salesOfEachMonthData,
    salesPerWeak: salesPerWeakData,
    salesOfEachYear: salesOfEachYearData,
    topProductsData: topProductsData,
  });
});

// method post
// route /api/v1/admin/documents
// @desc update documents
const updateDocuments = catchAsync(async (req, res, next) => {
  const { error, value } = editDocumentsValidation.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }
  const data = await admindocs_model.findOne();

  // no to files equal
  noTwoFilesEqual(
    value,
    ["privacy_policy", "terms_and_conditions", "about_us"],
    "No two files can be equal",
    next
  );
  if (!data) {
    if (value.privacy_policy) {
      // if value.privacy_policy is not end with pdf
      if (!value.privacy_policy.endsWith(".pdf")) {
        return next(new AppError("privacy_policy must be a pdf", 400));
      }
      const imageExists = await checkImageExists([value.privacy_policy]);
      if (imageExists.includes(false)) {
        return next(new AppError("privacy_policy image not found in aws", 400));
      }
      const duplicateImage = await checkDuplicateAwsImgInRecords([
        value.privacy_policy,
      ]);
      if (!duplicateImage.success) {
        return next(new AppError(duplicateImage.message, 400));
      }
    }
    if (value.terms_and_conditions) {
      if (!value.terms_and_conditions.endsWith(".pdf")) {
        return next(new AppError("terms_and_conditions must be a pdf", 400));
      }
      const imageExists = await checkImageExists([value.terms_and_conditions]);
      if (imageExists.includes(false)) {
        return next(
          new AppError("terms_and_conditions image not found in aws", 400)
        );
      }
      const duplicateImage = await checkDuplicateAwsImgInRecords([
        value.terms_and_conditions,
      ]);
      if (!duplicateImage.success) {
        return next(new AppError(duplicateImage.message, 400));
      }
    }
    if (value.about_us) {
      if (!value.about_us.endsWith(".pdf")) {
        return next(new AppError("about_us must be a pdf", 400));
      }
      const imageExists = await checkImageExists([value.about_us]);
      if (imageExists.includes(false)) {
        return next(new AppError("about_us image not found in aws", 400));
      }
      const duplicateImage = await checkDuplicateAwsImgInRecords([
        value.about_us,
      ]);
      if (!duplicateImage.success) {
        return next(new AppError(duplicateImage.message, 400));
      }
    }
    let newDocs = await admindocs_model.create({
      ...value,
    });
    const signPrivacyPolicy = await generateSignedUrl([newDocs.privacy_policy]);
    const signTermsAndConditions = await generateSignedUrl([
      newDocs.terms_and_conditions,
    ]);
    const signAboutUs = await generateSignedUrl([newDocs.about_us]);
    newDocs.privacy_policy = signPrivacyPolicy[0];
    newDocs.terms_and_conditions = signTermsAndConditions[0];
    newDocs.about_us = signAboutUs[0];
    return successMessage(200, res, "Documents Updated", newDocs);
  } else {
    if (value.privacy_policy) {
      if (!value.privacy_policy.endsWith(".pdf")) {
        return next(new AppError("privacy_policy must be a pdf", 400));
      }
      const imageExists = await checkImageExists([value.privacy_policy]);
      if (imageExists.includes(false)) {
        return next(new AppError("privacy_policy image not found in aws", 400));
      }

      if (!(data.privacy_policy == value.privacy_policy)) {
        const duplicateImage = await checkDuplicateAwsImgInRecords([
          value.privacy_policy,
        ]);
        if (!duplicateImage.success) {
          return next(new AppError(duplicateImage.message, 400));
        }
        if (data.privacy_policy) {
          await deleteObjects([data.privacy_policy]);
        }
      }
    }
    if (value.terms_and_conditions) {
      if (!value.terms_and_conditions.endsWith(".pdf")) {
        return next(new AppError("terms_and_conditions must be a pdf", 400));
      }
      const imageExists = await checkImageExists([value.terms_and_conditions]);
      if (imageExists.includes(false)) {
        return next(
          new AppError("terms_and_conditions image not found in aws", 400)
        );
      }
      if (!(data.terms_and_conditions == value.terms_and_conditions)) {
        const duplicateImage = await checkDuplicateAwsImgInRecords([
          value.terms_and_conditions,
        ]);
        if (!duplicateImage.success) {
          return next(new AppError(duplicateImage.message, 400));
        }
        if (data.terms_and_conditions) {
          await deleteObjects([data.terms_and_conditions]);
        }
      }
    }
    if (value.about_us) {
      if (!value.about_us.endsWith(".pdf")) {
        return next(new AppError("about_us must be a pdf", 400));
      }
      const imageExists = await checkImageExists([value.about_us]);
      if (imageExists.includes(false)) {
        return next(new AppError("about_us image not found in aws", 400));
      }
      if (!(data.about_us == value.about_us)) {
        const duplicateImage = await checkDuplicateAwsImgInRecords([
          value.about_us,
        ]);
        if (!duplicateImage.success) {
          return next(new AppError(duplicateImage.message, 400));
        }
        if (data.about_us) {
          await deleteObjects([data.about_us]);
        }
      }
    }
    const updatedDocs = await admindocs_model.findOneAndUpdate(
      {},
      {
        ...value,
      },
      {
        new: true,
      }
    );
    const signPrivacyPolicy = await generateSignedUrl([
      updatedDocs.privacy_policy,
    ]);
    const signTermsAndConditions = await generateSignedUrl([
      updatedDocs.terms_and_conditions,
    ]);
    const signAboutUs = await generateSignedUrl([updatedDocs.about_us]);
    updatedDocs.privacy_policy = signPrivacyPolicy[0];
    updatedDocs.terms_and_conditions = signTermsAndConditions[0];
    updatedDocs.about_us = signAboutUs[0];
    return successMessage(200, res, "Documents Updated", updatedDocs);
  }
});

// method GET
// route /api/v1/admin/documents
// @desc get documents
// all do this with token
const getDocuments = catchAsync(async (req, res, next) => {
  const data = await admindocs_model.findOne();
  if (!data) {
    return next(new AppError("No documents found", 400));
  }
  let signPrivacyPolicy = null;
  if (data.privacy_policy) {
    signPrivacyPolicy = await generateSignedUrl([data.privacy_policy]);
    if (!signPrivacyPolicy) {
      return next(new AppError("privacy_policy image not found in aws", 400));
    }
  }
  let signTermsAndConditions = null;
  if (data.terms_and_conditions) {
    signTermsAndConditions = await generateSignedUrl([
      data.terms_and_conditions,
    ]);
    if (!signTermsAndConditions) {
      return next(
        new AppError("terms_and_conditions image not found in aws", 400)
      );
    }
  }
  let signAboutUs = null;
  if (data.about_us) {
    signAboutUs = await generateSignedUrl([data.about_us]);
    if (!signAboutUs) {
      return next(new AppError("about_us image not found in aws", 400));
    }
  }
  if (signPrivacyPolicy) {
    data.privacy_policy = signPrivacyPolicy[0];
  }
  if (signTermsAndConditions) {
    data.terms_and_conditions = signTermsAndConditions[0];
  }
  if (signAboutUs) {
    data.about_us = signAboutUs[0];
  }
  return successMessage(200, res, "Documents", data);
});

// method POST
// route /api/v1/admin/notifications
// @desc send notification
const sendNotification = catchAsync(async (req, res, next) => {
  const { error, value } = activeNotificationSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }
  if (value.receiverId) {
    const user = await user_model.findById(value.receiverId);
    if (!user) {
      return next(new AppError("receiver not found", 400));
    }
    await activeNotification_model.create(value);
    // send notification
    if (user.fcm_key) {
      const data = {
        notification: {
          title: "active Notification",
          body: {
            message: value.message,
          },
        },
        data: {
          title: "active Notification",
          body: {
            message: value.message,
          },
        },
        registration_ids: user.fcm_key,
      };
      await sendFirbaseNotification(data, process.env.fireBaseServerKey);
    }
  } else {
    await activeNotification_model.create(value);
    // send notification
    const data = {
      notification: {
        title: "active Notification",
        body: {
          message: value.message,
        },
      },
      data: {
        title: "active Notification",
        body: {
          message: value.message,
        },
      },
      to: "/topics/default",
    };

    await sendFirbaseNotification(data, process.env.fireBaseServerKey);
  }
  const notification = await adminNotification_model.create(value);
  return successMessage(200, res, "Notification sent", notification);
});

module.exports = {
  loginAdmin,
  logoutAdmin,
  forgotPassword,
  resetPassword,
  dashboard,
  updateDocuments,
  getDocuments,
  sendNotification,
};
