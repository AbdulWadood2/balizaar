// models
const chat_model = require("../Model/chat_model");
const user_model = require("../Model/user_model");
const activeNotification_model = require("../Model/activeNotification_model");
// catch async
const catchAsync = require("../utils/catchAsync");
// app error
const AppError = require("../utils/appError");

const { sendChatMessageSchema } = require("../utils/joi_validator");
const {
  successMessage,
  sendFirbaseNotification,
} = require("../functions/utility_functions");
const { generateSignedUrl } = require("../utils/aws");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
// socket io
const { getIo } = require("../utils/webSocket");

// method post
// route /api/v1/chat/
// @privacy only user can do this
// send chat message
const sendChatMessage = catchAsync(async (req, res, next) => {
  const { error, value } = sendChatMessageSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }
  if (req.user.id == value.receiverId) {
    return next(new AppError("You can't chat with yourself", 400));
  }
  const receiver = await user_model.findOne({ _id: value.receiverId });
  if (!receiver) {
    return next(new AppError("Receiver not found", 400));
  }
  const senderRecord = await user_model.findById(req.user.id);
  const isChatExists = await chat_model.findOne({
    senderId: req.user.id,
    receiverId: value.receiverId,
  });
  if (!isChatExists) {
    const newNotification = await activeNotification_model.create({
      receiverId: value.receiverId,
      message: `${senderRecord.name} sent you a message`,
    });
    const receiver = await user_model.findById(value.receiverId);
    if (receiver.notification) {
      if (receiver.fcm_key.length > 0) {
        const data = {
          notification: {
            title: "active Notification",
            body: {
              message: `${senderRecord.name} sent you a message`,
            },
          },
          data: {
            title: "active Notification",
            body: {
              message: `${senderRecord.name} sent you a message`,
            },
          },
          registration_ids: receiver.fcm_key,
        };

        await sendFirbaseNotification(data, process.env.fireBaseServerKey);
      }
    }
    const io = getIo();
    io.to(receiver.socketId).emit("newNotification", newNotification);
  }
  const senderId = req.user.id;
  const newChat = await chat_model.create({
    senderId,
    receiverId: value.receiverId,
    message: value.message,
  });
  const io = getIo();
  io.to(receiver.socketId).emit("newMessage", newChat);
  return successMessage(202, res, "chat message", newChat);
});

// method get
// route /api/v1/chat/
// @privacy only user can do this
// get chat message
const getChatMessage = catchAsync(async (req, res, next) => {
  const { receiverId } = req.query;
  const senderId = req.user.id;
  if (senderId == receiverId) {
    return next(new AppError("You can't chat with yourself", 400));
  }
  let receiver = await user_model.findById(receiverId);
  if (!receiver) {
    return next(new AppError("Receiver not found", 400));
  }
  const chats = await chat_model
    .find({
      $or: [
        { senderId: senderId, receiverId: receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
      delete: { $ne: senderId },
    })
    .sort({ createdAt: 1 });
  let online = false;
  // check the receiver.socketId is not empty array
  if (receiver.socketId.length > 0) {
    online = true;
  } else {
    online = false;
  }
  let userImage = await generateSignedUrl([receiver.userImage]);
  userImage = userImage[0];
  receiver = {
    name: receiver.name,
    userImage,
    online,
  };
  return successMessage(200, res, "chat message", {
    receiver,
    chats,
  });
});

// method get
// route /api/v1/chat/seen
// @privacy only user can do this
// seen chat message
const seenChatMessage = catchAsync(async (req, res, next) => {
  const { receiverId } = req.query;
  const senderId = req.user.id;
  if (senderId == receiverId) {
    return next(new AppError("You can't chat with yourself", 400));
  }
  const receiver = await user_model.findById(receiverId);
  if (!receiver) {
    return next(new AppError("Receiver not found", 400));
  }
  await chat_model.updateMany(
    { senderId: receiverId, receiverId: senderId },
    { isRead: true }
  );
  return successMessage(200, res, "chat message read successfully");
});

// method delete
// route /api/v1/chat/
// @privacy only user can do this
// delete chat message
const deleteChatMessage = catchAsync(async (req, res, next) => {
  const { receiverId } = req.query;
  const senderId = req.user.id;
  if (senderId == receiverId) {
    return next(new AppError("You can't chat with yourself", 400));
  }
  const receiver = await user_model.findById(receiverId);
  if (!receiver) {
    return next(new AppError("Receiver not found", 400));
  }
  await chat_model.updateMany(
    {
      $or: [
        { senderId: senderId, receiverId: receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
      // Ensure delete array does not have the senderId already
      delete: { $ne: senderId },
    },
    // Push senderId into delete array
    { $push: { delete: senderId } }
  );

  return successMessage(200, res, "chat message deleted successfully");
});

// method get
// route /api/v1/chat/oneToOne
// @privacy only user can do this
// get one to one chat message
const getOneToOneChatMessage = catchAsync(async (req, res, next) => {
  const senderId = req.user.id;
  let chat = await chat_model
    .find({
      $or: [{ senderId: senderId }, { receiverId: senderId }],
      delete: { $ne: senderId },
    })
    .lean()
    .sort({ createdAt: -1 });
  // sperate discussion with the same user
  chat = chat.reduce((acc, chat) => {
    const key = chat.senderId == senderId ? chat.receiverId : chat.senderId;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(chat);
    return acc;
  }, {});
  chat = Object.values(chat);
  chat = chat.map(async (chat) => {
    let receiverUser;
    if (chat[0].senderId.toString() !== senderId) {
      receiverUser = await user_model
        .findById(chat[0].senderId)
        .select("name userImage socketId")
        .lean();
    } else {
      receiverUser = await user_model
        .findById(chat[0].receiverId)
        .select("name userImage socketId")
        .lean();
    }
    if (receiverUser.userImage) {
      const signUrl = await generateSignedUrl([receiverUser.userImage]);
      receiverUser.userImage = signUrl[0];
    }
    if (receiverUser.socketId.length > 0) {
      receiverUser.status = "online";
    } else {
      receiverUser.status = "offline";
    }

    return {
      receiver: receiverUser,
      chat: chat,
    };
  });
  chat = await Promise.all(chat);
  return successMessage(200, res, "chat message", chat);
});

module.exports = {
  sendChatMessage,
  getChatMessage,
  seenChatMessage,
  deleteChatMessage,
  getOneToOneChatMessage,
};
