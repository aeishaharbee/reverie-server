import express, { Response } from "express";
import { authMiddleware, AuthenticatedRequest } from "../../middleware/auth";
import { Save } from "../../models/Save";
import { Post } from "../../models/Post";
import { User } from "../../models/User";
import { Collection } from "../../models/Collection";
import { Types } from "mongoose";

const router = express.Router();

// CREATE NEW COLLECTION
router.post(
  "/",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      let user = await User.findById(req.user._id);
      if (!user) return res.status(400).json({ msg: "User not found" });

      let saveUser = await Save.findOne({ user: user._id });
      if (!saveUser)
        return res.status(400).json({ msg: "You haven't saved any post yet" });

      const postIds: Types.ObjectId[] = req.body.posts.map(
        (postId: string) => new Types.ObjectId(postId)
      );
      const allPostsExist = postIds.every((postId: Types.ObjectId) =>
        saveUser.posts.some((savedPost) => savedPost.post.equals(postId))
      );
      if (!allPostsExist) {
        return res.status(400).json({
          msg: "One or more posts do not exist in the user's saved posts",
        });
      }

      let firstPost = await Post.findById(postIds[0]);
      if (!firstPost) return res.status(400).json({ msg: "No post" });
      let coverImage = firstPost.images[0].image;
      if (!coverImage) return res.status(400).json({ msg: "No image" });
      let nameExist = await Collection.findOne({ name: req.body.name });
      if (nameExist)
        return res
          .status(400)
          .json({ msg: "A collection with the same name already existed" });

      let collection = await Collection.create({
        user: user._id,
        name: req.body.name,
        image: coverImage,
        posts: postIds.map((postId) => ({ post: postId })),
      });
      await saveUser.collections.push({
        collection: collection._id as Types.ObjectId,
      });

      await saveUser.save();
      await collection.save();

      return res.status(201).json({ coverImage });
    } catch (e) {
      return res.status(400).json({ error: (e as Error).message });
    }
  }
);

// EDIT COLLECTION --> name, cover image, selected posts
router.put(
  "/:id",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      // collection id
      let user = await User.findById(req.user._id);
      if (!user) return res.status(400).json({ msg: "User not found" });

      let collection = await Collection.findById(req.params.id);
      if (!collection)
        return res.status(400).json({ msg: "Collection not found" });

      if (user._id.toString() != collection.user.toString())
        return res.status(400).json({ msg: "This is not your collection" });

      let saveUser = await Save.findOne({ user: user._id });
      if (!saveUser)
        return res.status(400).json({ msg: "You haven't saved any post yet" });

      if (req.body.posts) {
        const postIds: Types.ObjectId[] = req.body.posts.map(
          (postId: string) => new Types.ObjectId(postId)
        );
        const allPostsExist = postIds.every((postId: Types.ObjectId) =>
          saveUser.posts.some((savedPost) => savedPost.post.equals(postId))
        );
        if (!allPostsExist) {
          return res.status(400).json({
            msg: "One or more posts do not exist in your saved posts",
          });
        }

        let firstPost = await Post.findById(postIds[0]);
        if (!firstPost) return res.status(400).json({ msg: "No post" });
        let coverImage = firstPost.images[0].image;
        if (!coverImage) return res.status(400).json({ msg: "No image" });

        collection.image = coverImage;

        collection.posts = postIds.map((postId) => ({ post: postId as any }));
      }

      if (req.body.name) {
        let nameExist = await Collection.findOne({ name: req.body.name });
        if (nameExist && nameExist._id != collection._id) {
          return res.status(400).json({
            msg: "A collection with the same name already exists",
            // value: nameExist._id.toString() !== collection._id.toString(),
          });
        }
        collection.name = req.body.name;
      }

      await collection.save();
      return res.status(201).json(collection);
    } catch (e) {
      return res.status(400).json({ error: (e as Error).message });
    }
  }
);

// ADD / REMOVE POST TO EXISTING COLLECTION (make sure post is inside SAVE) --> for single post
router.post(
  "/:id",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      let user = await User.findById(req.user._id);
      if (!user) return res.status(400).json({ msg: "User not found" });

      let collection = await Collection.findById(req.params.id);
      if (!collection)
        return res.status(400).json({ msg: "Collection not found" });

      if (user._id.toString() !== collection.user.toString())
        return res.status(400).json({ msg: "This is not your collection" });

      let saveUser = await Save.findOne({ user: user._id });
      if (!saveUser)
        return res.status(400).json({ msg: "You haven't saved any posts yet" });

      const postId = req.body.postId;

      const postExists = saveUser.posts.some(
        (savedPost) => savedPost.post.toString() === postId.toString()
      );

      if (!postExists) {
        return res
          .status(400)
          .json({ msg: "This post is not in your saved posts" });
      }

      const postIndexInCollection = collection.posts.findIndex(
        (collectedPost) => collectedPost.post.toString() === postId.toString()
      );

      if (postIndexInCollection !== -1) {
        collection.posts.splice(postIndexInCollection, 1);
        await collection.save();
        return res
          .status(200)
          .json({ msg: "Post removed from collection", collection });
      }

      collection.posts.push({ post: postId });

      await collection.save();
      return res.status(200).json(collection);
    } catch (e) {
      return res.status(400).json({ error: (e as Error).message });
    }
  }
);

// DELETE ENTIRE COLLECTION
router.delete(
  "/:id",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    // collection id
    try {
    } catch (e) {
      return res.status(400).json({ error: (e as Error).message });
    }
  }
);

export { router as collectionRouter };
