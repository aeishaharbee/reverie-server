import express, { Request, Response } from "express";
import { Like } from "../models/Like";
import { Post } from "../models/Post";
import { Comment } from "../models/Comment";
import { Noti } from "../models/Noti";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth";

const router = express.Router();

// ADD LIKE
router.post(
  "/:id",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user._id;
      if (!user)
        return res.status(400).json({ msg: "User information is missing" });

      let post = await Post.findById(req.params.id);
      if (post) {
        //
        // FOR POST
        let likeExist = await Like.findOne({
          user,
          post: req.params.id,
          postType: "Post",
        });

        if (likeExist) {
          //   @ts-ignore
          post.likes.pull({ liker: likeExist._id });
          await post.save();
          await Like.findByIdAndDelete(likeExist._id);

          // DELETE NOTI
          let notiExist = await Noti.findOne({
            userFrom: req.user._id,
            userNoti: post.user,
            post: req.params.id,
            postType: "Post",
            notiType: "Liked",
          });
          if (notiExist) {
            await Noti.findByIdAndDelete(notiExist._id);
          }

          return res.status(200).json({ msg: "Unliked a post" });
        }

        let like = await Like.create({
          user,
          post: req.params.id,
          postType: "Post",
        });

        // SEND NOTI
        if (req.user._id !== post.user.toString()) {
          await Noti.create({
            userFrom: req.user._id,
            userNoti: post.user,
            post: req.params.id,
            postType: "Post",
            notiType: "Liked",
          });
        }

        //   @ts-ignore
        post.likes.push({ liker: like._id });
        await post.save();
        return res.status(200).json({
          msg: "Liked a post",
          valid: req.user._id !== post.user.toString(),
        });
        //
        //
      } else {
        //
        //
        // FOR COMMENT
        let comment = await Comment.findById(req.params.id);
        if (!comment)
          return res
            .status(400)
            .json({ msg: "Neither post nor comment was found" });

        let likeExist = await Like.findOne({
          user,
          post: req.params.id,
          postType: "Comment",
        });

        if (likeExist) {
          //   @ts-ignore
          comment.likes.pull({ liker: likeExist._id });
          await comment.save();
          await Like.findByIdAndDelete(likeExist._id);

          // DELETE NOTI
          let notiExist = await Noti.findOne({
            userFrom: req.user._id,
            userNoti: comment.user,
            post: comment.post,
            notiContent: req.params.id,
            postType: "Comment",
            notiType: "Liked",
          });
          if (notiExist) {
            await Noti.findByIdAndDelete(notiExist._id);
          }

          return res.status(200).json({ msg: "Unliked a comment" });
        }

        let like = await Like.create({
          user,
          post: req.params.id,
          postType: "Comment",
        });

        // SEND NOTI
        if (req.user._id !== comment.user.toString()) {
          await Noti.create({
            userFrom: req.user._id,
            userNoti: comment.user,
            post: comment.post,
            notiContent: req.params.id,
            postType: "Comment",
            notiType: "Liked",
          });
        }

        //   @ts-ignore
        comment.likes.push({ liker: like._id });
        await comment.save();
        return res.status(200).json({ msg: "Liked a comment" });
      }
    } catch (e) {
      return res.status(400).json({ error: (e as Error).message });
    }
  }
);

export { router as likeRouter };
