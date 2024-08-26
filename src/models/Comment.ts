import mongoose from "mongoose";

interface IComment {
  body: string;
  user: mongoose.Schema.Types.ObjectId;
  post: mongoose.Schema.Types.ObjectId;
  likes: Array<{ liker: mongoose.Schema.Types.ObjectId }>;
  created_at: Date;
}

interface CommentDoc extends mongoose.Document {
  body: string;
  user: mongoose.Schema.Types.ObjectId;
  post: mongoose.Schema.Types.ObjectId;
  likes: Array<{ liker: mongoose.Schema.Types.ObjectId }>;
  created_at: Date;
}

interface CommentModelInterface extends mongoose.Model<CommentDoc> {
  build(attr: IComment): CommentDoc;
}

const CommentSchema = new mongoose.Schema({
  body: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  post: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
  likes: [
    {
      liker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Like",
      },
      _id: false,
    },
  ],
  created_at: { type: Date, default: Date.now },
});

CommentSchema.statics.build = (attr: IComment) => {
  return new Comment(attr);
};

const Comment = mongoose.model<CommentDoc, CommentModelInterface>(
  "Comment",
  CommentSchema
);

export { Comment };
