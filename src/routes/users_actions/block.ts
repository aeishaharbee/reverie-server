import express, { Response } from "express";
import { authMiddleware, AuthenticatedRequest } from "../../middleware/auth";
import { User, IUser } from "../../models/User";

const router = express.Router();

// BLOCK / UNBLOCK
router.post(
  "/:id",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user: IUser | null = await User.findById(req.user._id);
      const userToBlock = await User.findById(req.params.id);
      if (!userToBlock || !user)
        return res.status(400).json({ msg: "User not found" });

      if (user._id.toString() === userToBlock._id.toString())
        return res.status(400).json({ msg: "Cannot block yourself" });

      const isAlreadyBlocked = user.blocks.find(
        (blockObj) => blockObj.block.toString() === userToBlock._id.toString()
      );

      if (isAlreadyBlocked) {
        user.blocks = user.blocks.filter(
          (blockObj) => blockObj.block.toString() !== userToBlock._id.toString()
        );
        await user.save();

        return res.status(200).json({
          msg: "Unblocked successfully",
          follower: user,
          following: userToBlock,
        });
      }

      const isAlreadyFollowing = user.followings.find(
        (followingObj) =>
          followingObj.following.toString() === userToBlock._id.toString()
      );

      if (isAlreadyFollowing) {
        user.followings = user.followings.filter(
          (followingObj) =>
            followingObj.following.toString() !== userToBlock._id.toString()
        );
        await user.save();

        userToBlock.followers = userToBlock.followers.filter(
          (followerObj) =>
            followerObj.follower.toString() !== user._id.toString()
        );
        await userToBlock.save();
      }

      user.blocks.push({ block: userToBlock._id });
      await user.save();

      return res.status(200).json({
        msg: "Blocked successfully",
        blocker: user,
        blocked: userToBlock,
      });
    } catch (e) {
      return res.status(400).json({ error: (e as Error).message });
    }
  }
);

export { router as blockRouter };
