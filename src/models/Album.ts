import mongoose from "mongoose";

interface IAlbum {
  user: mongoose.Schema.Types.ObjectId;
  name: string;
  image: string;
  posts: Array<{ post: mongoose.Schema.Types.ObjectId }>;
}

interface AlbumDoc extends mongoose.Document {
  user: mongoose.Schema.Types.ObjectId;
  name: string;
  image: string;
  posts: Array<{ post: mongoose.Schema.Types.ObjectId }>;
}

interface AlbumModelInterface extends mongoose.Model<AlbumDoc> {
  build(attr: IAlbum): AlbumDoc;
}

const AlbumSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name: { type: String, required: true },
  image: { type: String },
  posts: [
    {
      post: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
      _id: false,
    },
  ],
});

AlbumSchema.statics.build = (attr: IAlbum) => {
  return new Album(attr);
};

const Album = mongoose.model<AlbumDoc, AlbumModelInterface>(
  "Album",
  AlbumSchema
);

export { Album };
