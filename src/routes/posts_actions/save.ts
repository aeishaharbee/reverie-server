import express, { Response } from "express";
import { authMiddleware, AuthenticatedRequest } from "../../middleware/auth";
import { Save } from "../../models/Save";
import { Post } from "../../models/Post";
import { User } from "../../models/User";
import { Types } from "mongoose";

const router = express.Router();

// GET SAVE BY USER
router.get(
  "/",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      let saveExist = await Save.findOne({ user: req.user._id })
        .populate({
          path: "user",
          select: "-password",
        })
        .populate({
          path: "posts.post",
          populate: [
            {
              path: "user",
              select: "-password",
            },
            {
              path: "comments.comment",
              select: "body user likes created_at",
              populate: [
                {
                  path: "user",
                  select: "-password",
                },
                {
                  path: "likes.liker",
                  populate: {
                    path: "user",
                    select: "-password",
                  },
                },
              ],
            },
            {
              path: "likes.liker",
              populate: {
                path: "user",
                select: "-password",
              },
            },
          ],
        });
      if (!saveExist)
        return res
          .status(200)
          .json({ msg: "You haven't saved any post yet.", saveExist });
      return res.status(200).json({ saveExist });
    } catch (e) {
      return res.status(400).json({ error: (e as Error).message });
    }
  }
);

// FIND POST IN SAVE
router.get(
  "/post/:id",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      let saveExist = await Save.findOne({ user: req.user._id });
      if (!saveExist)
        return res.json({ msg: "You haven't saved any post yet." });

      let post = await Post.findById(req.params.id);
      if (!post) return res.status(400).json({ msg: "Post not found" });

      const isAlreadySaved = saveExist.posts.find(
        (postObj) => postObj.post.toString() == post._id
      );
      if (!isAlreadySaved)
        return res
          .status(200)
          .json({ msg: "You haven't saved this post yet.", saveExist: null });

      return res
        .status(200)
        .json({ msg: "Post found inside your save.", saveExist });
    } catch (e) {
      return res.status(400).json({ error: (e as Error).message });
    }
  }
);

// ADD POST TO SAVE
router.post(
  "/:id",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      let post = await Post.findById(req.params.id);
      if (!post) return res.status(400).json({ msg: "Post not found" });

      let saveUser = await User.findById(req.user._id);
      if (!saveUser)
        return res.status(400).json({ msg: "User to save not found" });

      let postUser = await User.findById(post.user);
      if (!postUser)
        return res.status(400).json({ msg: "Post's user not found" });

      if (postUser.isPrivate) {
        const isAlreadyFollowing = saveUser.followings.find(
          (followingObj) =>
            followingObj.following.toString() === postUser._id.toString()
        );
        const saveOwnPost = saveUser._id.toString() === postUser._id.toString();
        if (!isAlreadyFollowing && !saveOwnPost)
          return res
            .status(400)
            .json({ msg: "This account's post is private" });
      }

      let saveExist = await Save.findOne({ user: saveUser._id });
      if (saveExist) {
        // IF ALREADY SAVED SAME POST, REMOVE FROM SAVED
        const isAlreadySaved = saveExist.posts.find(
          (postObj) => postObj.post.toString() == post._id
        );
        if (isAlreadySaved) {
          if (saveExist.posts.length === 1) {
            await Save.deleteOne({ _id: saveExist._id });
            return res.status(200).json({
              msg: "Save removed completely since it had only one post",
            });
          }

          saveExist.posts = saveExist.posts.filter(
            (postObj) => postObj.post.toString() != post._id
          );

          await saveExist.save();
          return res.status(200).json({ msg: "Removed from save", saveExist });
        }

        // IF FIRST TIME SAVE THE POST
        saveExist.posts.push({ post: post._id as Types.ObjectId });
        await saveExist.save();
      } else {
        saveExist = await Save.create({
          user: saveUser._id,
          posts: [{ post: post._id as Types.ObjectId }],
        });
      }

      return res.status(200).json({ msg: "Added to save", saveExist });
    } catch (e) {
      return res.status(400).json({ error: (e as Error).message });
    }
  }
);

// REMOVE POST FROM SAVE
router.delete(
  "/:id",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      let post = await Post.findById(req.params.id);
      if (!post) return res.status(400).json({ msg: "Post not found" });

      let saveUser = await User.findById(req.user._id);
      if (!saveUser)
        return res
          .status(400)
          .json({ msg: "User to remove saved post not found" });

      let saveExist = await Save.findOne({ user: saveUser._id });
      if (!saveExist)
        return res.status(400).json({ msg: "Save collection not found" });

      if (saveExist.posts.length === 1) {
        await Save.deleteOne({ _id: saveExist._id });
        return res.json({
          msg: "Save removed completely since it had only one post",
        });
      }

      saveExist.posts = saveExist.posts.filter(
        (postObj) => postObj.post.toString() != post._id
      );

      await saveExist.save();
      return res.json({ saveExist });
    } catch (e) {
      return res.status(400).json({ error: (e as Error).message });
    }
  }
);

export { router as saveRouter };
