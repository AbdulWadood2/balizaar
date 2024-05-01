const Joi = require("joi");

// joi for signup user
const signUpUserValidation = Joi.object({
  email: Joi.string().required(),
  password: Joi.string().required(),
  name: Joi.string().required(),
  phoneNumber: Joi.string().required(),
  location: Joi.object({
    type: Joi.string().valid("Point").required(),
    coordinates: Joi.array().items(Joi.number()).length(2).required(),
  }).allow(null),
});

// joi for edit user
const editUserValidation = Joi.object({
  name: Joi.string().allow(null),
  phoneNumber: Joi.string().allow(null),
  location: Joi.object({
    type: Joi.string().valid("Point").required(),
    coordinates: Joi.array().items(Joi.number()).length(2).required(),
  }).allow(null),
  bio: Joi.string().allow(null),
  userImage: Joi.string().allow(null),
  productStatus: Joi.string().valid("0", "1", "2").allow(null),
  notification: Joi.boolean().allow(null),
});

// Define Joi schema for product validation
const productValidationSchema = Joi.object({
  productImage: Joi.array().items(Joi.string().required()).required(),
  productName: Joi.string().required(),
  listingType: Joi.string().valid("0", "1").required(), // Assuming listingType can be '0' or '1'
  productPrice: Joi.number().required(),
  openToOffers: Joi.boolean().default(false),
  productDescription: Joi.string().required(),
  categoryName: Joi.string().required(),
});
// Define Joi schema for editing a product
const editProductValidationSchema = Joi.object({
  productImage: Joi.array().items(Joi.string().allow(null)),
  productName: Joi.string().allow(null),
  listingType: Joi.string().valid("0", "1").allow(null),
  productPrice: Joi.number().allow(null),
  openToOffers: Joi.boolean().default(false).allow(null),
  productDescription: Joi.string().required(),
  categoryName: Joi.string().allow(null),
});

// edit product status joi
const editProductStatusValidation = Joi.object({
  productStatus: Joi.number().valid(0, 1, 2).required(),
  clientId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .allow(null),
  productId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .allow(null),
});

// create category joi
const createCategoryValidation = Joi.object({
  categoryName: Joi.string().required(),
  categoryImage: Joi.string().required(),
});

// edit category joi
const editCategoryValidation = Joi.object({
  categoryName: Joi.string().allow(null),
  categoryImage: Joi.string().allow(null),
});

// chat joi
const sendChatMessageSchema = Joi.object({
  receiverId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required(),
  message: Joi.string().required(),
});
// admindocument joi
const editDocumentsValidation = Joi.object({
  privacy_policy: Joi.string().allow(null).optional(),
  terms_and_conditions: Joi.string().allow(null).optional(),
  about_us: Joi.string().allow(null).optional(),
});
// customize feed joi
const editCustomizeFeedSchema = Joi.object({
  categories: Joi.array().items(Joi.string()).optional().allow(null),
});

// search alert joi
const searchAlertValidationSchema = Joi.object({
  categories: Joi.array().items(Joi.string()),
  minMaxPrice: Joi.object({
    min: Joi.number().default(0).positive(),
    // max greator than min
    max: Joi.number().greater(Joi.ref("min")).positive(),
  }),
  searchWords: Joi.array().items(Joi.string()),
});

// review joi
const reviewValidationSchema = Joi.object({
  // sallerId must be objectId
  sallerId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required(),
  stars: Joi.number().required().min(1).max(5),
  comment: Joi.string().required().max(500),
});

// contact us joi
const contactUsValidationSchema = Joi.object({
  subject: Joi.string().required(),
  message: Joi.string().required(),
});

// questionare joi
const questionareValidationSchema = Joi.object({
  question: Joi.string().required(),
  answer: Joi.string().required(),
  category: Joi.string().valid("faqs", "category").required(),
});
// advertisement joi
const advertisementSchema = Joi.object({
  name: Joi.string().required(),
  // images: Joi.array().items(Joi.string().required()).required(),
  // length of images array should be 1
  images: Joi.array().items(Joi.string().required()).length(1).required(),
  url: Joi.string().required(),
});
// update advertisement joi
const updateAdvertisementSchema = Joi.object({
  name: Joi.string().allow(null),
  images: Joi.array().items(Joi.string().allow(null)),
  url: Joi.string().allow(null),
});

// adminNotification joi
const activeNotificationSchema = Joi.object({
  receiverId: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
  message: Joi.string().required(),
});


// Define Joi schema for validation
const filterProductJoiSchema = Joi.object({
  searchTerm: Joi.string().allow(null),
  searchRadius: Joi.number().min(0).default(null),
  category: Joi.array().items(Joi.string()),
  sort: Joi.number().valid(0, 1).default(null), // 0 for relavant, 1 for most recent
  price: Joi.object({
    min: Joi.number().min(0).default(null).allow(0),
    max: Joi.number().greater(Joi.ref("min")).default(null).allow(0),
  }).default({
    min: null,
    max: null,
  }),
}).options({ abortEarly: false }); // This option ensures all validation errors are returned, not just the first one


module.exports = {
  signUpUserValidation,
  productValidationSchema,
  editProductValidationSchema,
  editProductStatusValidation,
  editUserValidation,
  createCategoryValidation,
  editCategoryValidation,
  sendChatMessageSchema,
  editDocumentsValidation,
  editCustomizeFeedSchema,
  searchAlertValidationSchema,
  reviewValidationSchema,
  contactUsValidationSchema,
  questionareValidationSchema,
  advertisementSchema,
  updateAdvertisementSchema,
  activeNotificationSchema,
  filterProductJoiSchema,
};
