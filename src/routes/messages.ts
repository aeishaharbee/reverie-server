import express, { Response } from "express";
import { AuthenticatedRequest, authMiddleware } from "../middleware/auth";
import { Messages } from "../models/Messages";
import { User } from "../models/User";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

router.get(
  "/",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { sender, receiver } = req.query;

      if (!sender || !receiver) {
        return res
          .status(400)
          .json({ error: "Sender and receiver are required" });
      }

      const decoded = jwt.verify(
        sender.toString(),
        process.env.SECRET_KEY as string
      ) as jwt.JwtPayload;

      const senderId = decoded.data._id;

      const senderUser = await User.findById(senderId);
      const receiveUser = await User.findOne({ username: receiver });

      const messages = await Messages.find({
        $or: [
          { sender: senderUser?._id, receiver: receiveUser?._id },
          { sender: receiveUser?._id, receiver: senderUser?._id },
        ],
      }).sort({ timestamp: 1 });

      if (!messages.length) {
        return res
          .status(200)
          .json({
            msg: "No messages found",
            sender: senderUser,
            receiver: receiveUser,
            messages: [],
          });
      }

      res.status(200).json({
        msg: "Fetched messages",
        sender: senderUser,
        receiver: receiveUser,
        messages,
      });
    } catch (e) {
      return res.status(400).json({ error: (e as Error).message });
    }
  }
);

export { router as messagesRouter };
