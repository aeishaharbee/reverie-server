import express, { Request, Response } from "express";
import { Comment } from "../models/Comment";
import { Post } from "../models/Post";
import { Like } from "../models/Like";
import { Noti } from "../models/Noti";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth";
import mongoose from "mongoose";

const router = express.Router();

// ADD COMMENT
router.post(
  "/:id",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user._id;
      if (!user) {
        return res.status(400).json({ msg: "User information is missing" });
      }

      const post = await Post.findById(req.params.id);
      if (!post) {
        return res.status(404).json({ msg: "Post not found" });
      }

      const comment = await Comment.create({
        body: req.body.body,
        user,
        post: req.params.id,
        created_at: new Date(),
      });

      // SEND NOTI
      if (user !== post.user.toString()) {
        await Noti.create({
          userFrom: user,
          userNoti: post.user,
          post,
          postType: "Post",
          notiContent: comment._id,
          notiType: "Commented",
        });
      }

      // Explicitly cast comment._id to mongoose.Types.ObjectId
      //   @ts-ignore
      post.comments.push({ comment: comment._id as mongoose.Types.ObjectId });

      await post.save();
      return res.json({
        msg: "Commented successfully",
        valid: req.user._id !== post.user.toString(),
        comment,
      });
    } catch (e) {
      return res.status(400).json({ error: (e as Error).message });
    }
  }
);

// DELETE COMMENT
router.delete(
  "/:postId/:commentId",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user._id;
      if (!user) {
        return res.status(400).json({ msg: "User information is missing" });
      }

      const post = await Post.findById(req.params.postId);
      if (!post) {
        return res.status(404).json({ msg: "Post not found" });
      }

      const comment = await Comment.findById(req.params.commentId);
      if (!comment) {
        return res.status(404).json({ msg: "Comment not found" });
      }

      if (comment.user != user)
        return res.status(404).json({ msg: "You can't delete this comment" });

      await Like.deleteMany({ post: comment._id });

      // DELETE NOTI
      let notiExist = await Noti.findOne({
        userFrom: user,
        userNoti: post.user,
        post,
        postType: "Post",
        notiContent: comment._id,
        notiType: "Commented",
      });
      if (notiExist) {
        await Noti.findByIdAndDelete(notiExist._id);
      }

      // @ts-ignore
      post.comments.pull({ comment: comment._id });
      await post.save();
      await Comment.findByIdAndDelete(comment._id);
      return res.status(200).json({ msg: "Deleted a comment" });
    } catch (e) {
      return res.status(400).json({ error: (e as Error).message });
    }
  }
);

export { router as commentRouter };
