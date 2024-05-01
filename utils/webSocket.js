const socketIo = require("socket.io");
// models
const User = require("../Model/user_model");

let io; // Declare a variable to store the 'io' object

function initializeSocket(server) {
  io = socketIo(server, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", async (socket) => {
    console.log("User connected ", `${socket.id}`);
    // Listen for user authentication event
    socket.on("connectUser", async (userId) => {
      try {
        if (userId) {
          // Retrieve user from database
          const user = await User.findOne({ _id: userId });
          if (user) {
            // Disconnect all previous sockets associated with the same user
            const previousSockets = await io.in(userId).allSockets();
            for (const previousSocketId of previousSockets) {
              if (previousSocketId !== socket.id) {
                io.sockets.sockets.get(previousSocketId).disconnect(true);
              }
            }

            // Update user model with socket ID
            user.socketId.push(socket.id);
            await user.save();

            console.log(
              `Socket ID ${socket.id} associated with user ${user.name} connected`
            );
            const connectedUser = {
              userId: user._id,
              status: "online",
            };
            // find all users with socketId array not empty
            const users = await User.find({ socketId: { $ne: [] } });
            // collect the socketIds in one array
            const socketIds = users.map((user) => user.socketId);
            // emit the connected user to all users
            io.to(socketIds[0]).emit("userConnected", connectedUser);
          }
        }
      } catch (err) {
        console.log({ err });
      }
    });

    // Disconnect event
    socket.on("disconnect", async () => {
      console.log("User disconnected");
      // Remove socket ID from user model upon disconnection
      let user = await User.find({ socketId: socket.id });
      if (user.length > 0) {
        user = user.map(async (user) => {
          // pull socket.id
          user.socketId.pull(socket.id);
          await user.save();
          const disconnectedUser = {
            userId: user._id,
            status: "offline",
          };
          // find all users with socketId array not empty
          const users = await User.find({ socketId: { $ne: [] } });
          // collect the socketIds in one array
          const socketIds = users.map((user) => user.socketId);
          console.log(socketIds);
          // emit the disconnected user to all users
          io.to(socketIds[0]).emit("userDisconnected", disconnectedUser);
          console.log(
            `Socket ID ${socket.id} disassociated from user ${user.name}`
          );
        });
      }
    });

    socket.on("newMessage", async (data) => {
      try {
        io.to(data.socketId).emit("newMessage", data.newChat);
      } catch (error) {
        console.log(error);
        socket.emit("error", "An error occurred");
      }
    });
    let users = await User.find({ socketId: { $ne: [] } });
    users = users.map(async (user) => {
      const userIs = await User.findById(user._id);
      user.socketId.map(async (socketId) => {
        if (!(io.sockets.sockets.get(socketId) ? true : false)) {
          userIs.socketId.pull(socketId);
        }
      });
      await userIs.save();
    });
    await Promise.all(users);
  });
  return io;
}
// Export a function that returns the 'io' object when called
module.exports = {
  initializeSocket,
  getIo: () => io, // Return the 'io' object
};
