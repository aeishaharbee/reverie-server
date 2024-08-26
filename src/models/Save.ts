import mongoose, { Types, Schema, Document, Model } from "mongoose";

interface ISave {
  user: Types.ObjectId;
  posts: Array<{ post: Types.ObjectId }>;
  collections: Array<{ collection: Types.ObjectId }>;
}

interface SaveDoc extends Document {
  user: Types.ObjectId;
  posts: Array<{ post: Types.ObjectId }>;
  collections: Array<{ collection: Types.ObjectId }>;
}

interface SaveModelInterface extends Model<SaveDoc> {
  build(attr: ISave): SaveDoc;
}

const SaveSchema = new Schema<SaveDoc>({
  user: { type: Schema.Types.ObjectId, ref: "User" },
  posts: [
    {
      post: { type: Schema.Types.ObjectId, ref: "Post" },
      _id: false,
    },
  ],
  collections: [
    {
      collection: { type: Schema.Types.ObjectId, ref: "Collection" },
      _id: false,
    },
  ],
});

SaveSchema.statics.build = (attr: ISave) => {
  return new Save(attr);
};

const Save = mongoose.model<SaveDoc, SaveModelInterface>("Save", SaveSchema);

export { Save };
