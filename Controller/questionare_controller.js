// catch async
const catchAsync = require("../utils/catchAsync.js");
// model
const questionare_model = require("../Model/questionare_model.js");
// utility functions
const { successMessage } = require("../functions/utility_functions.js");
// app error
const AppError = require("../utils/appError.js");
// joi validation
const { questionareValidationSchema } = require("../utils/joi_validator.js");
const {} = require("../utils/aws.js");

// method post
// path: /api/v1/questionare
// only admin can access
// create questionare
const createQuestionare = catchAsync(async (req, res, next) => {
  // get data from body
  const { error, value } = questionareValidationSchema.validate(req.body);
  // check if error
  if (error) {
    // If validation fails, respond with the validation error
    return successMessage(400, res, error.details[0].message);
  }

  const question = await questionare_model.findOne({
    question: value.question,
  });
  // check if question already exist
  if (question) {
    return successMessage(400, res, "Question already exist");
  }
  // create questionare
  const questionare = await questionare_model.create(value);
  // send response
  return successMessage(201, res, questionare);
});

// method get
// path: /api/v1/questionare
// get all questionare
// all user can access or admin also
const getAllQuestionare = catchAsync(async (req, res, next) => {
  // get all questionare
  const faqs = await questionare_model.find({ category: "faqs" });
  const category = await questionare_model.find({ category: "category" });

  // send response
  return successMessage(200, res, {
    faqs,
    category,
  });
});

// method put
// path: /api/v1/questionare
// only admin can access
// edit questionare
const editQuestionare = catchAsync(async (req, res, next) => {
  const questionareId = req.query.questionareId;
  console.log(req.body)
  // get data from body
  const { error, value } = questionareValidationSchema.validate(req.body);
  // check if error
  if (error) {
    // If validation fails, respond with the validation error
    return successMessage(400, res, error.details[0].message);
  }
  const questionare = await questionare_model.findOne({
    _id: questionareId,
  });
  if (value.question !== questionare.question) {
    const question = await questionare_model.findOne({
      question: value.question,
    });
    // check if question already exist
    if (question) {
      return successMessage(400, res, "Question already exist");
    }
  }
  // create questionare
  const editedQuestionare = await questionare_model.findOneAndUpdate(
    { _id: questionareId },
    value,
    { new: true }
  );
  // send response
  return successMessage(201, res, editedQuestionare);
});

// method delete
// path: /api/v1/questionare
// only admin can access
// delete questionare
const deleteQuestionare = catchAsync(async (req, res, next) => {
  const questionareId = req.query.questionareId;

  // delete questionare
  await questionare_model.findOneAndDelete({ _id: questionareId });
  // send response
  return successMessage(200, res, "Questionare deleted successfully");
});

module.exports = { createQuestionare, getAllQuestionare, editQuestionare,deleteQuestionare };
