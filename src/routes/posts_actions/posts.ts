import express, { Request, Response } from "express";
import { Post } from "../../models/Post";
import { User } from "../../models/User";
import { Comment } from "../../models/Comment";
import { Like } from "../../models/Like";
import { authMiddleware, AuthenticatedRequest } from "../../middleware/auth";
import multer, { StorageEngine } from "multer";
import path from "path";
import fs from "fs";
import { Save } from "../../models/Save";
import { Noti } from "../../models/Noti";
import { ObjectId } from "mongoose";

const router = express.Router();

// GET POSTS FROM FOLLOWING ACCOUNT
router.get(
  "/following",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user._id;
      const currentUser = await User.findById(userId).populate({
        path: "followings.following",
        select: "_id",
      });

      if (!currentUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const followingUserIds = currentUser.followings.map(
        (following: { following: ObjectId }) => following.following
      );

      const posts = await Post.find({ user: { $in: followingUserIds } })
        .populate({
          path: "user",
          select: "-password",
        })
        .populate({
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
        })
        .populate({
          path: "likes.liker",
          populate: {
            path: "user",
            select: "-password",
          },
        })
        .sort({ created_at: -1 });

      return res.status(200).json(posts);
    } catch (e) {
      return res.status(400).json({ error: (e as Error).message });
    }
  }
);

// GET POSTS FROM FAVOURITE ACCOUNT
router.get(
  "/favourite",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user._id;
      const currentUser = await User.findById(userId).populate({
        path: "favourites.favourite",
        select: "_id",
      });

      if (!currentUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const favouriteUserIds = currentUser.favourites.map(
        (favourite: { favourite: ObjectId }) => favourite.favourite
      );

      const posts = await Post.find({ user: { $in: favouriteUserIds } })
        .populate({
          path: "user",
          select: "-password",
        })
        .populate({
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
        })
        .populate({
          path: "likes.liker",
          populate: {
            path: "user",
            select: "-password",
          },
        })
        .sort({ created_at: -1 });

      return res.status(200).json(posts);
    } catch (e) {
      return res.status(400).json({ error: (e as Error).message });
    }
  }
);

// GET RANDOM POSTS FROM PUBLIC ACCOUNT
router.get(
  "/random",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const currentUserId = req.user._id;

      const publicUsers = await User.find({ isPrivate: false }).select("_id");
      if (!publicUsers.length) {
        return res.status(200).json([]);
      }

      const posts = await Post.find({
        $and: [
          { user: { $in: publicUsers.map((user) => user._id) } },
          { isDisplay: true },
          { user: { $ne: currentUserId } },
        ],
      })
        .sort({ created_at: -1 })
        .limit(12)
        .populate({
          path: "user",
          select: "-password",
        })
        .populate({
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
        })
        .populate({
          path: "likes.liker",
          populate: {
            path: "user",
            select: "-password",
          },
        })
        .exec();

      return res.status(200).json(posts);
    } catch (e) {
      return res.status(400).json({ error: (e as Error).message });
    }
  }
);

// GET OWN POST FROM A USER
router.get(
  "/owner",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const posts = await Post.find({ user: req.user._id })
        .populate({
          path: "user",
          select: "-password",
        })
        .populate({
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
        })
        .populate({
          path: "likes.liker",
          populate: {
            path: "user",
            select: "-password",
          },
        })
        .sort({ created_at: -1 }) // Sort by date in descending order
        .exec();
      return res.status(200).send(posts);
    } catch (e) {
      return res.status(400).json({ error: (e as Error).message });
    }
  }
);

// GET ALL POSTS
router.get("/", async (req: Request, res: Response) => {
  const posts = await Post.find();
  return res.status(200).send(posts);
});

// GET POST BY ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
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
      })
      .populate({
        path: "likes.liker",
        populate: {
          path: "user",
          select: "-password",
        },
      });
    return res.status(200).send(post);
  } catch (e) {
    return res.status(400).json({ error: (e as Error).message });
  }
});

// GET ALL POST FROM A USER
router.get("/user/:id", async (req: Request, res: Response) => {
  try {
    const posts = await Post.find({ user: req.params.id })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
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
      })
      .populate({
        path: "likes.liker",
        populate: {
          path: "user",
          select: "-password",
        },
      });
    return res.status(200).send(posts);
  } catch (e) {
    return res.status(400).json({ error: (e as Error).message });
  }
});

// POST NEW POST
const storage: StorageEngine = multer.diskStorage({
  destination: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ): void => {
    cb(null, "./public");
  },
  filename: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ): void => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage, limits: { files: 20 } });

router.post(
  "/",
  authMiddleware,
  upload.array("images", 20),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userSub = req.user._id;

      if (!userSub) {
        return res
          .status(400)
          .send({ msg: "User information is missing from token" });
      }

      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({ msg: "No images uploaded" });
      }

      const post = new Post({
        ...req.body,
        user: userSub,
        images: files.map((file) => ({ image: file.filename })),
      });

      await post.save();
      return res.status(201).send(post);
    } catch (e) {
      return res.status(400).json({ error: (e as Error).message });
    }
  }
);

// DELETE ENTIRE POST
router.delete(
  "/:id",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const post: any = await Post.findById(req.params.id);
      if (!post || post.user != req.user._id)
        return res.status(400).json({ msg: "You can't delete this post" });

      if (post.images && Array.isArray(post.images)) {
        post.images.forEach((imageObj: { image: string }) => {
          const filePath: string = path.join("./public", imageObj.image);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
      }

      let comments = await Comment.find({ post: req.params.id });
      comments.map(async (comment) => {
        await Like.deleteMany({ post: comment._id });
      });
      await Comment.deleteMany({ post: post._id });
      await Like.deleteMany({ post: post._id });
      await Noti.deleteMany({ post: post._id });

      await Save.updateMany(
        { "posts.post": req.params.id },
        { $pull: { posts: { post: req.params.id } } }
      );

      // ADD FOR ALBUM LATER

      await Post.findByIdAndDelete(req.params.id);
      return res.json({ msg: "Post deleted successfully" });
    } catch (e) {
      return res.status(400).json({ error: (e as Error).message });
    }
  }
);

// DELETE EACH IMAGE
router.delete(
  "/:postId/:imageName",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { postId, imageName } = req.params;
      const post = await Post.findById(postId);

      if (!post || post.user.toString() !== req.user?._id) {
        return res.status(400).json({ msg: "You can't modify this post" });
      }

      // check if post has more than one image
      if (post.images.length <= 1) {
        return res
          .status(400)
          .json({ msg: "Cannot delete the only image in the post" });
      }

      // find image by filename
      const imageIndex = post.images.findIndex(
        (img) => img.image === imageName
      );

      if (imageIndex === -1) {
        return res.status(404).json({ msg: "Image not found" });
      }

      const imageToDelete = post.images[imageIndex].image;
      const filePath = path.join("./public", imageToDelete);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      post.images.splice(imageIndex, 1);
      await post.save();

      return res.json({ msg: "Image deleted successfully", post });
    } catch (e) {
      return res.status(400).json({ error: (e as Error).message });
    }
  }
);

// EDIT POST
router.put(
  "/:id",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const post: any = await Post.findById(req.params.id);
      if (!post || post.user != req.user._id)
        return res.status(400).json({ msg: "You can't edit this post" });

      if (req.body.caption !== undefined) {
        post.caption = req.body.caption;
        post.updated_at = Date.now();
      }
      if (req.body.isDisplay !== undefined) {
        post.isDisplay = req.body.isDisplay;
      }
      if (req.body.isComment !== undefined) {
        post.isComment = req.body.isComment;
      }
      if (req.body.isLike !== undefined) {
        post.isLike = req.body.isLike;
      }

      await post.save();
      return res.status(200).json({ msg: "Post updated successfully", post });
    } catch (e) {
      return res.status(400).json({ error: (e as Error).message });
    }
  }
);

export { router as postRouter };
