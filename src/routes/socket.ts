// src/socket.ts
import { Server } from "socket.io";
import { User } from "../models/User";
import { Messages } from "../models/Messages";

export const initSocket = (io: Server) => {
  io.on("connection", (socket) => {
    socket.on("joined", () => {
      io.sockets.emit("new-user", "new user joined");
    });

    socket.on("private message", async (to, message, mySelf) => {
      try {
        const user = await User.findOne({ username: to });
        if (!user) return;

        const sender = await User.findOne({ username: mySelf });

        if (!sender) return;

        io.sockets.emit("refresh", "new Message");

        const newMessage = {
          receiver: user._id,
          message,
          sender: sender._id,
          timestamp: new Date(),
        };

        const messageDoc = Messages.build(newMessage);
        await messageDoc.save();
      } catch (error) {
        console.error("Error handling private message:", error);
      }
    });
  });
};
