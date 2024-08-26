import express, { Response } from "express";
import { authMiddleware, AuthenticatedRequest } from "../../middleware/auth";
import { User } from "../../models/User";
import { Types } from "mongoose";
import { IPost, Post } from "../../models/Post";
import { Album } from "../../models/Album";

const router = express.Router();

// GET ALBUM BY ID
router.get(
  "/:id",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const album = await Album.findById(req.params.id)
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
      if (!album) return res.status(400).json({ msg: "Album not found" });

      return res.status(200).json(album);
    } catch (e) {
      return res.status(400).json({ error: (e as Error).message });
    }
  }
);

// GET ALBUM BY USER
router.get(
  "/user/:userId",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await User.findById(req.params.userId);
      if (!user) return res.status(400).json({ msg: "User not found" });

      const albums = await Album.find({ user: user._id }).populate({
        path: "user",
        select: "-password",
      });
      return res.status(200).json({ albums, length: albums.length });
    } catch (e) {
      return res.status(400).json({ error: (e as Error).message });
    }
  }
);

// NEW ALBUM
router.post(
  "/",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await User.findById(req.user._id);
      if (!user) return res.status(400).json({ msg: "User not found" });

      const userPosts = (await Post.find({ user: user._id })) as IPost[];
      if (!userPosts.length)
        return res.status(400).json({ msg: "You haven't posted any post yet" });

      const postIds: Types.ObjectId[] = req.body.posts.map(
        (postId: string) => new Types.ObjectId(postId)
      );

      const allPostsExist = postIds.every((postId: Types.ObjectId) =>
        userPosts.some(
          (postedPost) => postedPost._id.toString() === postId.toString()
        )
      );

      if (!allPostsExist) {
        return res.status(400).json({
          msg: "One or more posts do not exist in the user's posted posts",
        });
      }

      let firstPost = await Post.findById(postIds[0]);
      let coverImage = firstPost?.images[0].image;

      let album = await Album.create({
        user: user._id,
        name: req.body.name,
        image: coverImage,
        posts: postIds.map((postId) => ({ post: postId })),
      });

      await album.save();

      return res.status(200).json(album);
    } catch (e) {
      return res.status(400).json({ error: (e as Error).message });
    }
  }
);

// EDIT ALBUM
router.put(
  "/:id",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      let user = await User.findById(req.user._id);
      if (!user) return res.status(400).json({ msg: "User not found" });

      let album = await Album.findById(req.params.id);
      if (!album) return res.status(400).json({ msg: "Album not found" });

      if (user._id.toString() != album.user.toString())
        return res.status(400).json({ msg: "This is not your album" });

      const userPosts = (await Post.find({ user: user._id })) as IPost[];
      if (!userPosts.length)
        return res.status(400).json({ msg: "You haven't posted any post yet" });

      if (req.body.posts) {
        const postIds: Types.ObjectId[] = req.body.posts.map(
          (postId: string) => new Types.ObjectId(postId)
        );
        const allPostsExist = postIds.every((postId: Types.ObjectId) =>
          userPosts.some(
            (postedPost) => postedPost._id.toString() === postId.toString()
          )
        );
        if (!allPostsExist) {
          return res.status(400).json({
            msg: "One or more posts do not exist in your posted posts",
          });
        }

        let firstPost = await Post.findById(postIds[0]);
        let coverImage = firstPost?.images[0].image;
        if (!coverImage) return res.status(400).json({ msg: "No image" });

        album.image = coverImage;

        album.posts = postIds.map((postId) => ({ post: postId as any }));
      }

      if (req.body.name) {
        album.name = req.body.name;
      }

      await album.save();

      const populatedAlbum = await Album.findById(req.params.id)
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

      return res.status(201).json(populatedAlbum);
    } catch (e) {
      return res.status(400).json({ error: (e as Error).message });
    }
  }
);

// ADD / REMOVE POST FROM ALBUM
router.post(
  "/:id",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      let user = await User.findById(req.user._id);
      if (!user) return res.status(400).json({ msg: "User not found" });

      let album = await Album.findById(req.params.id);
      if (!album) return res.status(400).json({ msg: "Album not found" });

      if (user._id.toString() !== album.user.toString())
        return res.status(400).json({ msg: "This is not your album" });

      let userPosts = (await Post.find({ user: user._id })) as IPost[];
      if (!userPosts.length)
        return res.status(400).json({ msg: "You haven't posted any post yet" });

      const postId = req.body.postId;

      const postExists = userPosts.some(
        (postedPost) => postedPost._id.toString() === postId.toString()
      );

      if (!postExists) {
        return res
          .status(400)
          .json({ msg: "This post is not in your posted posts" });
      }

      const postIndexInAlbum = album.posts.findIndex(
        (albumPost) => albumPost.post.toString() === postId.toString()
      );

      if (postIndexInAlbum !== -1) {
        album.posts.splice(postIndexInAlbum, 1);
        const updatedAlbum = await album.save();

        if (updatedAlbum.posts.length) {
          let firstPost = await Post.findById(updatedAlbum.posts[0].post);
          let coverImage = firstPost?.images[0].image;
          if (!coverImage) return res.status(400).json({ msg: "No image" });

          updatedAlbum.image = coverImage;
        } else {
          updatedAlbum.image = "";
        }

        await updatedAlbum.save();

        return res
          .status(200)
          .json({ msg: "Post removed from album", updatedAlbum });
      }

      album.posts.push({ post: postId });
      const updatedAlbum = await album.save();

      let firstPost = await Post.findById(updatedAlbum.posts[0].post);
      let coverImage = firstPost?.images[0].image;
      if (!coverImage) return res.status(400).json({ msg: "No image" });

      updatedAlbum.image = coverImage;
      await updatedAlbum.save();

      return res.status(200).json(updatedAlbum);
    } catch (e) {
      return res.status(400).json({ error: (e as Error).message });
    }
  }
);

// DELETE ENTIRE ALBUM
router.delete(
  "/:id",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      let user = await User.findById(req.user._id);
      if (!user) return res.status(400).json({ msg: "User not found" });

      let album = await Album.findById(req.params.id);
      if (!album) return res.status(400).json({ msg: "Album not found" });

      if (user._id.toString() !== album.user.toString())
        return res.status(400).json({ msg: "This is not your album" });

      await Album.findByIdAndDelete(album._id);
      return res.status(200).json({ msg: "Album deleted successfully" });
    } catch (e) {
      return res.status(400).json({ error: (e as Error).message });
    }
  }
);

export { router as albumRouter };
