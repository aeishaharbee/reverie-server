import mongoose from "mongoose";

export interface IUser {
  save(): Promise<IUser>;
  _id: mongoose.Schema.Types.ObjectId;
  fullname: string;
  username: string;
  email: string;
  password: string;
  image?: string;
  bio: string;
  isPrivate: boolean;
  isPremium: boolean;
  followings: Array<{ following: mongoose.Schema.Types.ObjectId }>;
  followers: Array<{ follower: mongoose.Schema.Types.ObjectId }>;
  blocks: Array<{ block: mongoose.Schema.Types.ObjectId }>;
  favourites: Array<{ favourite: mongoose.Schema.Types.ObjectId }>;
}

interface UserDoc extends mongoose.Document {
  _id: mongoose.Schema.Types.ObjectId;
  fullname: string;
  username: string;
  email: string;
  password: string;
  image?: string;
  bio: string;
  isPrivate: boolean;
  isPremium: boolean;
  followings: Array<{ following: mongoose.Schema.Types.ObjectId }>;
  followers: Array<{ follower: mongoose.Schema.Types.ObjectId }>;
  blocks: Array<{ block: mongoose.Schema.Types.ObjectId }>;
  favourites: Array<{ favourite: mongoose.Schema.Types.ObjectId }>;
}

interface UserModelInterface extends mongoose.Model<UserDoc> {
  build(attr: IUser): UserDoc;
}

const UserSchema = new mongoose.Schema({
  fullname: { type: String },
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  image: { type: String },
  bio: { type: String },
  isPrivate: { type: Boolean, default: false },
  isPremium: { type: Boolean, default: false },
  followings: [
    {
      following: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      _id: false,
    },
  ],
  followers: [
    {
      follower: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      _id: false,
    },
  ],
  blocks: [
    {
      block: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      _id: false,
    },
  ],
  favourites: [
    {
      favourite: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      _id: false,
    },
  ],
});

UserSchema.statics.build = (attr: IUser) => {
  return new User(attr);
};

const User = mongoose.model<UserDoc, UserModelInterface>("User", UserSchema);

export { User };
