// appError
const AppError = require("../utils/appError");
// for send simply success responses
let successMessage = (statusCode, res, message, data) => {
  return res.status(statusCode).json({
    status: "success",
    data,
    message,
  });
};
// userPasswordCheck
const userPasswordCheck = (user, password) => {
  // this package for encryption
  const CryptoJS = require("crypto-js");
  const hashedPassword = CryptoJS.AES.decrypt(
    user.password,
    process.env.CRYPTO_SEC
  );
  const realPassword = hashedPassword.toString(CryptoJS.enc.Utf8);
  if (password !== realPassword) {
    throw new AppError("password is incorrect", 400);
  }
};
// this will give us the random string by our length
let generateRandomString = (length) => {
  const characters =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let randomString = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomString += characters.charAt(randomIndex);
  }

  return randomString;
};
// for generate encrypted otp
const generateEncryptedOtp = (otp, expirationMinutes, email) => {
  const CryptoJS = require("crypto-js");
  const expirationTime = new Date().getTime() + expirationMinutes * 60 * 1000; // 5 minutes expiration
  const encryptedOtp = CryptoJS.AES.encrypt(
    JSON.stringify({ otp, expirationTime, email }),
    process.env.CRYPTO_SEC
  ).toString();
  return encryptedOtp;
};
// I make it specially for send otp of any range flexible
const generateRandomNumber = (max) => {
  const min = Math.pow(10, max - 1);
  const maxExclusive = Math.pow(10, max);
  return Math.floor(Math.random() * (maxExclusive - min)) + min;
};
// validate expiration test
const validateOtpExpiration = (expirationTime) => {
  if (new Date().getTime() > expirationTime) {
    throw new AppError("Verification code has expired", 400);
  }
};
// decryptAndValidateOtp
const decryptAndValidateOtp = (encryptedOtp) => {
  try {
    const decrypted = decryptEncryptedOtp(encryptedOtp);
    const otpData = JSON.parse(decrypted);
    const { otp, expirationTime, email } = otpData;
    return { otp, expirationTime, email };
  } catch (error) {
    throw new AppError("Invalid encrypted options format", 400);
  }
};
// decryptEncryptedOtp
const decryptEncryptedOtp = (encryptedOtp) => {
  try {
    const CryptoJS = require("crypto-js");
    return CryptoJS.AES.decrypt(
      decodeURIComponent(encryptedOtp),
      process.env.CRYPTO_SEC
    ).toString(CryptoJS.enc.Utf8);
  } catch (error) {
    throw new AppError("Invalid encrypted options format", 400);
  }
};
// check duplication of aws image in db
const checkDuplicateAwsImgInRecords = async (fileName, fieldName) => {
  try {
    const user_model = require("../Model/user_model.js");
    const product_model = require("../Model/product_model.js");
    const category_model = require("../Model/category_model.js");
    const admindocs_model = require("../Model/admindocs_model.js");
    const advertisement_model = require("../Model/advertisement_model.js");
    const [user, product, category, admindocs, advertisement] =
      await Promise.all([
        user_model.findOne({ userImage: fileName }),
        product_model.findOne({ productImage: fileName }),
        category_model.findOne({ categoryImage: fileName }),
        admindocs_model.findOne({
          $or: [
            { privacy_policy: fileName },
            { terms_and_conditions: fileName },
            { about_us: fileName },
          ],
        }),
        advertisement_model.findOne({ image: fileName }),
      ]);

    if (user || product || category || admindocs || advertisement) {
      return {
        message: `This ${fieldName} is already used`,
        success: false,
      };
    }

    // If none of the promises find a match, return some success message or proceed with other logic.
    return {
      message: `${fieldName} is unique and can be used.`,
      success: true,
    };
  } catch (error) {
    return {
      message: `An error occurred while checking ${fieldName}`,
      success: false,
    };
  }
};
const checkDuplicateAwsImgsInRecords = async (fileNames, fieldName) => {
  try {
    const promises = fileNames.map(async (fileName) => {
      const user_model = require("../Model/user_model.js");
      const product_model = require("../Model/product_model.js");
      const category_model = require("../Model/category_model.js");
      const admindocs_model = require("../Model/admindocs_model.js");
      const advertisement_model = require("../Model/advertisement_model.js");
      const [user, product, category, admindocs, advertisement] =
        await Promise.all([
          user_model.findOne({ userImage: fileName }),
          product_model.findOne({ productImage: fileName }),
          category_model.findOne({ categoryImage: fileName }),
          admindocs_model.findOne({
            $or: [
              { privacy_policy: fileName },
              { terms_and_conditions: fileName },
              { about_us: fileName },
            ],
          }),
          advertisement_model.findOne({ image: fileName }),
        ]);

      if (user || product || category || admindocs || advertisement) {
        return fileName;
      }
    });

    const results = await Promise.all(promises);

    const duplicates = results.filter((fileName) => fileName);

    if (duplicates.length > 0) {
      return {
        message: `These ${fieldName} are already used: ${duplicates.join(
          ", "
        )}`,
        success: false,
      };
    }

    // If none of the promises find a match, return some success message or proceed with other logic.
    return {
      message: `${fieldName} is unique and can be used.`,
      success: true,
    };
  } catch (error) {
    return {
      message: `An error occurred while checking ${fieldName}`,
      success: false,
    };
  }
};
// no two files equal
const noTwoFilesEqual = function (value, fields, errorMessage, next) {
  const values = fields.map((field) => value[field]);

  for (let i = 0; i < values.length; i++) {
    for (let j = i + 1; j < values.length; j++) {
      if (values[i] && values[i] === values[j]) {
        return next(new AppError(errorMessage, 400));
      }
    }
  }
};
// set notification by firebase
async function sendFirbaseNotification(data, fireBaseServerKey) {
  try {
    const axios = require("axios");
    axios
      .post("https://fcm.googleapis.com/fcm/send", data, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `key=${fireBaseServerKey}`,
        },
      })
      .then((response) => {
        console.log("Successfully sent message:", response.data);
      })
      .catch((error) => {
        console.error("Error sending message:", error.response);
      });
  } catch (error) {
    console.error("Error sending message:", error);
  }
}

module.exports = {
  successMessage,
  userPasswordCheck,
  generateRandomString,
  generateEncryptedOtp,
  generateRandomNumber,
  decryptAndValidateOtp,
  validateOtpExpiration,
  checkDuplicateAwsImgInRecords,
  checkDuplicateAwsImgsInRecords,
  noTwoFilesEqual,
  sendFirbaseNotification,
};
