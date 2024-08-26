import mongoose from "mongoose";

interface ILike {
  user: mongoose.Schema.Types.ObjectId;
  post: mongoose.Schema.Types.ObjectId;
  postType: string;
}

interface LikeDoc extends mongoose.Document {
  user: mongoose.Schema.Types.ObjectId;
  post: mongoose.Schema.Types.ObjectId;
  postType: string;
}

interface LikeModelInterface extends mongoose.Model<LikeDoc> {
  build(attr: ILike): LikeDoc;
}

const LikeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  post: { type: mongoose.Schema.Types.ObjectId, refPath: "postType" },
  postType: {
    type: String,
    required: true,
    enum: ["Post", "Comment", "Story"],
  },
});

LikeSchema.statics.build = (attr: ILike) => {
  return new Like(attr);
};

const Like = mongoose.model<LikeDoc, LikeModelInterface>("Like", LikeSchema);

export { Like };
