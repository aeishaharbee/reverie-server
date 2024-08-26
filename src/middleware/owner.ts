// import mongoose from "mongoose";
// import { AuthenticatedRequest } from "./auth1";
// import { Response, NextFunction } from "express";
// import { Post } from "../models/Post";

// export const ownerMiddleware = async (
//   req: AuthenticatedRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { id } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({ msg: "Invalid post ID" });
//     }

//     const post = await Post.findById(id);

//     if (!post) {
//       return res.status(404).json({ msg: "Post not found" });
//     }

//     const userSub = req.user?.sub;

//     if (post.user !== userSub) {
//       return res
//         .status(403)
//         .json({ msg: "Forbidden: You do not own this post" });
//     }

//     next(); // Allow the request to proceed if the user owns the post
//   } catch (err) {
//     return res
//       .status(500)
//       .json({ error: "Server error", details: (err as Error).message });
//   }
// };
