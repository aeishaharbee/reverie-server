import mongoose from "mongoose";

interface ICollection {
  user: mongoose.Schema.Types.ObjectId;
  name: string;
  image: string;
  posts: Array<{ post: mongoose.Schema.Types.ObjectId }>;
}

interface CollectionDoc extends mongoose.Document {
  user: mongoose.Schema.Types.ObjectId;
  name: string;
  image: string;
  posts: Array<{ post: mongoose.Schema.Types.ObjectId }>;
}

interface CollectionModelInterface extends mongoose.Model<CollectionDoc> {
  build(attr: ICollection): CollectionDoc;
}

const CollectionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name: { type: String, required: true },
  image: { type: String, required: true },
  posts: [
    {
      post: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
      _id: false,
    },
  ],
});

CollectionSchema.statics.build = (attr: ICollection) => {
  return new Collection(attr);
};

const Collection = mongoose.model<CollectionDoc, CollectionModelInterface>(
  "Collection",
  CollectionSchema
);

export { Collection };
