// models
const contactUs_model = require("../Model/contactUs_model");
const user_model = require("../Model/user_model");
// catch async
const catchAsync = require("../utils/catchAsync");
// app error
const AppError = require("../utils/appError");

const { contactUsValidationSchema } = require("../utils/joi_validator");
const { successMessage } = require("../functions/utility_functions");
const { generateSignedUrl } = require("../utils/aws");

// method post
// path /api/v1/contact/
// access user only
// desc contact us
const sendContactUs = catchAsync(async (req, res, next) => {
  const { error, value } = contactUsValidationSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.message, 400));
  }
  const contactUs = await contactUs_model.create({
    userId: req.user.id,
    subject: value.subject,
    message: value.message,
  });
  return successMessage(202, res, "Message sent successfully", contactUs);
});

// method get
// path /api/v1/contact/
// access admin only
// desc get all contact us messages
const getAllContactUs = catchAsync(async (req, res, next) => {
  const { resolved = false } = req.query;
  let contactUs = await contactUs_model.find({ resolved }).lean();
  contactUs = contactUs.map(async (contact) => {
    const user = await user_model.findOne({ _id: contact.userId }).lean();
    const userImage = await generateSignedUrl([user.userImage]);
    return {
      ...contact,
      userName: user.name,
      email: user.email,
      userImage: userImage[0],
    };
  });
  contactUs = await Promise.all(contactUs);
  return successMessage(200, res, "All contact us messages", contactUs);
});

// method get
// path /api/v1/contact/
// access admin only
// desc make resolved
const makeResolved = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const contactUs = await contactUs_model.findByIdAndUpdate(
    id,
    {
      resolved: true,
    },
    {
      new: true,
    }
  );
  return successMessage(200, res, "Message resolved", contactUs);
});

module.exports = { sendContactUs, getAllContactUs, makeResolved };
