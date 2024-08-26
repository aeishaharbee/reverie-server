import express, { Response } from "express";
import { authMiddleware, AuthenticatedRequest } from "../../middleware/auth";
import { User, IUser } from "../../models/User";

const router = express.Router();

// FAV / UNFAV
router.post(
  "/:id",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user: IUser | null = await User.findById(req.user._id);
      const userToFav = await User.findById(req.params.id);
      if (!userToFav || !user)
        return res.status(400).json({ msg: "User not found" });

      if (user._id.toString() === userToFav._id.toString())
        return res.status(400).json({ msg: "Cannot fav yourself" });

      const isAlreadyFollowing = user.followings.find(
        (followingObj) =>
          followingObj.following.toString() === userToFav._id.toString()
      );
      const isAlreadyBlocked = user.blocks.find(
        (blockObj) => blockObj.block.toString() === userToFav._id.toString()
      );

      if (!isAlreadyFollowing || isAlreadyBlocked) {
        return res
          .status(403)
          .json({ msg: "You haven't followed this account" });
      }

      const isAlreadyFav = user.favourites.find(
        (favouriteObj) =>
          favouriteObj.favourite.toString() === userToFav._id.toString()
      );

      if (isAlreadyFav) {
        user.favourites = user.favourites.filter(
          (favouriteObj) =>
            favouriteObj.favourite.toString() !== userToFav._id.toString()
        );
        await user.save();

        return res.status(200).json({
          msg: "Account removed from your fav accounts successfully",
          favUser: null,
        });
      }

      user.favourites.push({ favourite: userToFav._id });
      await user.save();

      return res.status(200).json({
        msg: "Account added to your fav accounts successfully",
        favUser: userToFav,
      });
    } catch (e) {
      return res.status(400).json({ error: (e as Error).message });
    }
  }
);

export { router as favRouter };
