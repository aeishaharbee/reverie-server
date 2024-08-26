import express, { Response } from "express";
import { authMiddleware, AuthenticatedRequest } from "../../middleware/auth";
import { User, IUser } from "../../models/User";
import { Request } from "../../models/Request";
import { Noti } from "../../models/Noti";

const router = express.Router();

// FOLLOW / UNFOLLOW
router.post(
  "/:id",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user: IUser | null = await User.findById(req.user._id);
      const userToFollow = await User.findById(req.params.id);

      if (!userToFollow || !user)
        return res.status(400).json({ msg: "User not found" });

      if (user._id.toString() === userToFollow._id.toString())
        return res.status(400).json({ msg: "Cannot follow yourself" });

      // IF ALREADY REQUESTED, --> DELETE REQUESTED &  NOTI
      let requestExist = await Request.findOne({
        userRequestee: user._id,
        userRequested: userToFollow._id,
      });
      if (requestExist) {
        let noti = await Noti.findOne({
          userFrom: user._id,
          userNoti: userToFollow._id,
          post: requestExist._id,
          postType: "Request",
          notiType: "Requested",
        });
        if (noti) await Noti.findByIdAndDelete(noti._id);
        await Request.findByIdAndDelete(requestExist._id);
        return res.status(200).json({ msg: "Deleted follow request", user });
      }

      const isAlreadyBlocked = user.blocks.find(
        (blockObj) => blockObj.block.toString() === userToFollow._id.toString()
      );
      if (isAlreadyBlocked) {
        return res.status(403).json({ msg: "You blocked this account" });
      }

      // UNFOLLOW WHEN ALREADY FOLLOWED --> DELETE FOLLOW NOTI
      const isAlreadyFollowing = user.followings.find(
        (followingObj) =>
          followingObj.following.toString() === userToFollow._id.toString()
      );
      if (isAlreadyFollowing) {
        user.followings = user.followings.filter(
          (followingObj) =>
            followingObj.following.toString() !== userToFollow._id.toString()
        );
        user.favourites = user.favourites.filter(
          (favouriteObj) =>
            favouriteObj.favourite.toString() !== userToFollow._id.toString()
        );
        await user.save();

        userToFollow.followers = userToFollow.followers.filter(
          (followerObj) =>
            followerObj.follower.toString() !== user._id.toString()
        );
        await userToFollow.save();

        // DELETE NOTI
        let noti = await Noti.findOne({
          userFrom: user._id,
          userNoti: userToFollow._id,
          notiType: "Followed",
        });
        if (noti) await Noti.findByIdAndDelete(noti._id);

        // DELETE REQUEST (IF EXISTED)
        let request = await Request.findOne({
          userRequestee: user._id,
          userRequested: userToFollow._id,
        });
        if (request) await Request.findByIdAndDelete(request._id);

        return res.status(200).json({
          msg: "Unfollowed successfully",
          userToFollow: null,
          follower: user,
          following: userToFollow,
        });
      }

      // FOLLOW REQUEST TO PRIVATE ACCOUNT --> NOTI
      if (userToFollow.isPrivate) {
        // return res.status(403).json({ msg: "Account is private" });

        let request = await Request.create({
          userRequestee: user._id,
          userRequested: userToFollow._id,
        });

        let noti = await Noti.create({
          userFrom: user._id,
          userNoti: userToFollow._id,
          post: request._id,
          postType: "Request",
          notiType: "Requested",
        });

        return res
          .status(200)
          .json({ msg: "Sent a follow request", request, noti, userToFollow });
      }

      // IF ACC PUBLIC, AUTO SAVE --> NOTI
      let noti = await Noti.create({
        userFrom: user._id,
        userNoti: userToFollow._id,
        notiType: "Followed",
      });

      user.followings.push({ following: userToFollow._id });
      await user.save();

      userToFollow.followers.push({ follower: user._id });
      await userToFollow.save();

      return res.status(200).json({
        msg: "Followed successfully",
        user,
        userToFollow,
        noti,
      });
    } catch (e) {
      return res.status(400).json({ error: (e as Error).message });
    }
  }
);

// REMOVE FOLLWOER
router.delete(
  "/:id",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user: IUser | null = await User.findById(req.user._id);
      const userToRemove = await User.findById(req.params.id);
      if (!userToRemove || !user)
        return res.status(400).json({ msg: "User not found" });

      if (user._id.toString() === userToRemove._id.toString())
        return res
          .status(400)
          .json({ msg: "Cannot proceed action with your own account" });

      const isFollower = user.followers.find(
        (followerObj) =>
          followerObj.follower.toString() === userToRemove._id.toString()
      );
      if (!isFollower)
        return res.status(400).json({ msg: "This user is not following you" });

      user.followers = user.followers.filter(
        (followerObj) =>
          followerObj.follower.toString() !== userToRemove._id.toString()
      );
      await user.save();

      userToRemove.followings = userToRemove.followings.filter(
        (followingObj) =>
          followingObj.following.toString() !== user._id.toString()
      );
      await userToRemove.save();

      let noti = await Noti.findOne({
        userFrom: userToRemove._id,
        userNoti: user._id,
        notiType: "Followed",
      });
      if (noti) await Noti.findByIdAndDelete(noti._id);

      return res.status(200).json({
        msg: "Follower removed successfully",
      });
      //
    } catch (e) {
      return res.status(400).json({ error: (e as Error).message });
    }
  }
);

export { router as followRouter };
