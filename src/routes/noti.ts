import express, { Response } from "express";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth";
import { Noti } from "../models/Noti";
import { User } from "../models/User";

const router = express.Router();

// GET ALL NOTIS OF A USER TOKEN
router.get(
  "/",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const posts = await Noti.find({ userNoti: req.user._id })
        .populate({
          path: "userFrom",
          select: "-password",
        })
        .populate("post")
        .populate("notiContent")
        .sort({ created_at: -1 }) // Sort by date in descending order
        .exec();
      return res.status(200).send(posts);
    } catch (e) {
      return res.status(400).json({ error: (e as Error).message });
    }
  }
);

export { router as notiRouter };
