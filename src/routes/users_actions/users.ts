import express, { Request, Response } from "express";
import { User } from "../../models/User";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { AuthenticatedRequest, authMiddleware } from "../../middleware/auth";
import multer, { StorageEngine } from "multer";
import path from "path";
import fs from "fs";
import { Post } from "../../models/Post";

dotenv.config();
const router = express.Router();
const { SECRET_KEY } = process.env;

// SEARCH FOR FOLLOWINGS
router.get(
  "/search/following",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const query = req.query.query as string;

      // Find the current user and populate the followings
      const currentUser = await User.findById(req.user._id).populate<{
        followings: { following: typeof User.prototype }[];
      }>("followings.following");

      if (currentUser && query) {
        // Filter the followings based on the query
        const results = currentUser.followings
          .filter(
            (following) =>
              following.following.username.match(new RegExp(query, "i")) ||
              following.following.fullname.match(new RegExp(query, "i"))
          )
          .map((following) => ({
            _id: following.following._id,
            username: following.following.username,
            fullname: following.following.fullname,
            image: following.following.image,
          }));

        return res.send(results);
      }
      res.send([]);
    } catch (error) {
      console.log(error);
      res.send([]);
    }
  }
);

// GET FOLLOWINGS
router.get(
  "/following",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await User.findOne({ _id: req.user._id }).populate(
        "followings.following",
        "_id fullname username image isPrivate"
      );

      if (!user) {
        return res.status(400).json({ msg: "User doesn't exist" });
      }

      const followings = user.followings.map((f) => f.following);

      return res.status(200).json(followings);
    } catch (e) {
      return res.status(400).json({ error: (e as Error).message });
    }
  }
);

// SEARCH FOR USERNAME / FULLNAME
router.get(
  "/search",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { query } = req.query;
      if (query) {
        const results = await User.find({
          $and: [
            {
              $or: [
                { username: { $regex: query, $options: "i" } },
                { fullname: { $regex: query, $options: "i" } },
              ],
            },
            { _id: { $ne: req.user._id } },
          ],
        }).select("username fullname _id image");

        return res.send(results);
      }
      res.send([]);
    } catch (error) {
      console.log(error);
      res.send([]);
    }
  }
);

// GET OWN BY TOKEN
router.get("/own/:token", async (req: Request, res: Response) => {
  try {
    const token = req.params.token;

    if (!token) {
      return res.status(400).json({ msg: "No token provided" });
    }

    const decoded = jwt.verify(
      token,
      process.env.SECRET_KEY as string
    ) as jwt.JwtPayload;

    const userId = decoded.data._id;

    const currentUser = await User.findById(userId)
      .populate("followings.following", "_id fullname username image isPrivate")
      .populate("followers.follower", "_id fullname username image isPrivate")
      .populate("favourites.favourite", "_id fullname username image isPrivate")
      .populate("blocks.block", "_id fullname username image isPrivate");

    // if (!currentUser) {
    //   return res.status(400).json({ msg: "User doesn't exist" });
    // }

    return res.status(200).json(currentUser);
  } catch (e) {
    return res.status(400).json({ error: (e as Error).message });
  }
});

// GET ALL USERS EXCEPT TOKEN
router.get(
  "/token/:token",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const token = req.params.token;

      if (!token) {
        return res.status(400).json({ msg: "No token provided" });
      }

      const decoded = jwt.verify(
        token,
        process.env.SECRET_KEY as any
      ) as jwt.JwtPayload;
      const userFetched = decoded.data;

      const currentUser = await User.findById(userFetched._id)
        .populate(
          "followings.following",
          "_id fullname username image isPrivate"
        )
        .populate("followers.follower", "_id fullname username image isPrivate")
        .populate(
          "favourites.favourite",
          "_id fullname username image isPrivate"
        )
        .populate("blocks.block", "_id fullname username image isPrivate");

      if (!currentUser) {
        return res.status(400).json({ msg: "User doesn't exist" });
      }

      // Find all users except the current user
      const users = await User.find({
        _id: { $ne: currentUser._id }, // Exclude the current user by their ID
      }).select("_id fullname username image isPrivate");

      return res.status(200).json(users);
    } catch (e) {
      return res.status(400).json({ error: (e as Error).message });
    }
  }
);

// GET OWN USER INFO
router.get(
  "/owner",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await User.findById(req.user._id)
        .populate(
          "followings.following",
          "_id fullname username image isPrivate"
        )
        .populate("followers.follower", "_id fullname username image isPrivate")
        .populate(
          "favourites.favourite",
          "_id fullname username image isPrivate"
        )
        .populate("blocks.block", "_id fullname username image isPrivate");
      if (!user) return res.status(400).json({ msg: "User doesn't exist" });
      return res.status(200).json(user);
    } catch (e) {
      return res.status(400).json({ error: (e as Error).message });
    }
  }
);

// GET ALL USERS
router.get("/", async (req: Request, res: Response) => {
  const users = await User.find().select("-password");
  return res.status(200).send(users);
});

// GET ALL USERS EXCEPT req.user
router.get(
  "/all",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const users = await User.find(
        { _id: { $ne: req.user._id } },
        "_id fullname username image isPrivate"
      );

      if (!users || users.length === 0) {
        return res.status(400).json({ msg: "No other users found" });
      }

      return res.status(200).json(users);
    } catch (e) {
      return res.status(400).json({ error: (e as Error).message });
    }
  }
);

// GET USER BY USERNAME
router.get("/:username", async (req: Request, res: Response) => {
  const user = await User.findOne({ username: req.params.username })
    .select("-password")
    .populate("followings.following", "_id fullname username image isPrivate")
    .populate("followers.follower", "_id fullname username image isPrivate");
  return res.status(200).send(user);
});

// PFP HANDLING
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

const upload = multer({ storage });

// REGISTER
router.post("/register", async (req: Request, res: Response) => {
  try {
    const {
      username,
      email,
      password,
    }: { username: string; email: string; password: string } = req.body;

    let emailExist = await User.findOne({ email });
    let usernameExist = await User.findOne({ username });

    if (emailExist)
      return res.status(400).json({ msg: "Email already registered" });
    if (usernameExist)
      return res.status(400).json({ msg: "Username already exist" });

    let salt = bcrypt.genSaltSync(10);
    let hashedPassword = bcrypt.hashSync(password, salt);
    let newUser = new User({ ...req.body, password: hashedPassword });
    newUser.save();

    return res.json({ msg: "Registered Successfully", user: newUser });
  } catch (e) {
    return res.status(400).json({ error: (e as Error).message });
  }
});

// LOGIN
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { username, password }: { username: string; password: string } =
      req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ msg: "User doesn't exist" });

    const isMatch: boolean = bcrypt.compareSync(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid Credentials" });

    const token: string = jwt.sign({ data: user }, SECRET_KEY!, {
      expiresIn: "24h",
    });
    return res.json({ msg: "Logged In Successfully", token, user });
  } catch (e) {
    return res.status(400).json({ error: (e as Error).message });
  }
});

// EDIT PROFIEL
router.put(
  "/update",
  authMiddleware,
  upload.single("image"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await User.findOne({ _id: req.user._id });
      if (!user) return res.status(400).json({ msg: "User doesn't exist" });

      if (req.body.fullname !== undefined) {
        user.fullname = req.body.fullname;
      }
      if (req.body.username !== undefined) {
        let usernameExist = await User.findOne({ username: req.body.username });
        if (usernameExist?._id.toString() != user._id.toString())
          return res.status(400).json({ msg: "Username already exist" });

        user.username = req.body.username;
      }
      if (req.body.email !== undefined) {
        let emailExist = await User.findOne({ email: req.body.email });

        if (emailExist && emailExist._id.toString() !== user._id.toString()) {
          return res.status(400).json({
            msg: "Email already registered",
          });
        }

        user.email = req.body.email;
      }
      if (req.body.bio !== undefined) {
        user.bio = req.body.bio;
      }
      if (req.body.isPrivate !== undefined) {
        user.isPrivate = req.body.isPrivate;
      }
      if (req.file) {
        if (user.image) {
          const fileName = user.image;
          const filePath = path.join("./public/" + fileName);
          fs.unlinkSync(filePath);
        }

        user.image = req.file.filename;
      }

      if (req.body.isPremium !== undefined) {
        user.isPremium = req.body.isPremium;
      }

      await user.save();

      if (req.body.isPremium === false) {
        await Post.updateMany(
          { user: user._id },
          { $set: { isLike: true, isComment: true } }
        );
      }

      return res
        .status(200)
        .json({ msg: "User informations updated successfully", user });
    } catch (e) {
      return res.status(400).json({ error: (e as Error).message });
    }
  }
);

// DELETE PFP
router.delete(
  "/pfp",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await User.findOne({ _id: req.user._id });
      if (!user) return res.status(400).json({ msg: "User doesn't exist" });

      const fileName = user.image;
      const filePath = path.join("./public/" + fileName);
      fs.unlinkSync(filePath);

      await User.findByIdAndUpdate(
        req.user._id,
        { $unset: { image: "" } },
        { new: true }
      );

      await user.save();
      return res
        .status(200)
        .json({ msg: "User informations updated successfully", user });
    } catch (e) {
      return res.status(400).json({ error: (e as Error).message });
    }
  }
);

export { router as userRouter };
