import express, { Response } from "express";
import { authMiddleware, AuthenticatedRequest } from "../../middleware/auth";
import { User, IUser } from "../../models/User";
import { Request } from "../../models/Request";
import { Noti } from "../../models/Noti";

const router = express.Router();

// GET REQUEST
router.get(
  "/:id",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      let request = await Request.findOne({
        userRequestee: req.user._id,
        userRequested: req.params.id,
      });
      return res.json(request);
    } catch (e) {
      return res.status(400).json({ error: (e as Error).message });
    }
  }
);

// ACCEPT REQUEST
router.post(
  "/:id",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      let request = await Request.findById(req.params.id);
      if (!request) return res.status(400).json({ msg: "Request not found" });

      let user = await User.findById(req.user._id);
      if (!user) return res.status(400).json({ msg: "User not found" });

      console.log({ 1: user._id, 2: request.userRequested });
      if (user._id.toString() != request.userRequested.toString())
        return res.status(400).json({ msg: "You can't modify this request." });

      request.isApproved = true;
      request.dateApproved = new Date();

      let noti = await Noti.create({
        userFrom: request.userRequestee,
        userNoti: request.userRequested,
        notiType: "Followed",
      });

      let notiAccepted = await Noti.create({
        userFrom: request.userRequested,
        userNoti: request.userRequestee,
        notiType: "Accepted",
      });

      await noti.save();
      await notiAccepted.save();
      await request.save();

      let requestee = await User.findOne({ _id: request.userRequestee });
      let requested = await User.findOne({ _id: request.userRequested });
      if (!requestee || !requested)
        return res.status(400).json({ msg: "User not found" });

      requestee.followings.push({ following: requested._id });
      await requestee.save();

      requested.followers.push({ follower: requestee._id });
      await requested.save();

      return res.status(200).json({
        msg: "Request accepted successfully",
        noti,
        notiAccepted,
        request,
        requestee,
        requested,
      });
    } catch (e) {
      return res.status(400).json({ error: (e as Error).message });
    }
  }
);

// DELETE REQUEST
router.delete(
  "/:id",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      let request = await Request.findById(req.params.id);
      if (!request) return res.status(400).json({ msg: "Request not found" });

      let user = await User.findById(req.user._id);
      if (!user) return res.status(400).json({ msg: "User not found" });

      if (user._id.toString() !== request.userRequested.toString())
        return res.status(400).json({ msg: "You can't modify this request." });

      let noti = await Noti.findOne({
        userFrom: request.userRequestee,
        userNoti: request.userRequested,
        post: request._id,
        postType: "Request",
        notiType: "Requested",
      });
      if (noti) await Noti.findByIdAndDelete(noti._id);

      await Request.findByIdAndDelete(request._id);
      return res.status(200).json({
        msg: "Request deleted successfully",
      });
    } catch (e) {
      return res.status(400).json({ error: (e as Error).message });
    }
  }
);

export { router as requestRouter };
