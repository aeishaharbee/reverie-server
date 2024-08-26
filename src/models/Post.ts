import mongoose from "mongoose";

export interface IPost {
  _id: mongoose.Schema.Types.ObjectId;
  user: mongoose.Schema.Types.ObjectId;
  images: Array<{ image: string }>;
  caption?: string;
  comments: Array<{ comment: mongoose.Schema.Types.ObjectId }>;
  likes: Array<{ liker: mongoose.Schema.Types.ObjectId }>;
  isDisplay: boolean;
  isComment: boolean;
  isLike: boolean;
  scheduled_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

interface PostDoc extends mongoose.Document {
  user: mongoose.Schema.Types.ObjectId;
  images: Array<{ image: string }>;
  caption?: string;
  comments: Array<{ comment: mongoose.Schema.Types.ObjectId }>;
  likes: Array<{ liker: mongoose.Schema.Types.ObjectId }>;
  isDisplay: boolean;
  isComment: boolean;
  isLike: boolean;
  scheduled_at?: Date;
  created_at: Date;
  updated_at: Date;
}

interface PostModelInterface extends mongoose.Model<PostDoc> {
  build(attr: IPost): PostDoc;
}

const PostSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  images: [
    {
      image: { type: String, required: true },
      _id: false,
    },
  ],
  caption: { type: String },
  comments: [
    {
      comment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
      _id: false,
    },
  ],
  likes: [
    {
      liker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Like",
      },
      _id: false,
    },
  ],
  isDisplay: { type: Boolean, default: true },
  isComment: { type: Boolean, default: true },
  isLike: { type: Boolean, default: true }, // show like count
  scheduled_at: { type: Date },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

PostSchema.statics.build = (attr: IPost) => {
  return new Post(attr);
};

const Post = mongoose.model<PostDoc, PostModelInterface>("Post", PostSchema);

export { Post };
