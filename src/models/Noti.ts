import mongoose from "mongoose";

interface INoti {
  userFrom: mongoose.Schema.Types.ObjectId;
  userNoti: mongoose.Schema.Types.ObjectId;
  post?: mongoose.Schema.Types.ObjectId; // not compulsory bcs can be 'followed' noti !!!
  postType?: string;
  notiContent?: mongoose.Schema.Types.ObjectId;
  notiType: string;
  created_at: Date;
}

interface NotiDoc extends mongoose.Document {
  userFrom: mongoose.Schema.Types.ObjectId;
  userNoti: mongoose.Schema.Types.ObjectId;
  post?: mongoose.Schema.Types.ObjectId;
  postType?: string;
  notiContent?: mongoose.Schema.Types.ObjectId;
  notiType: string;
  created_at: Date;
}

interface NotiModelInterface extends mongoose.Model<NotiDoc> {
  build(attr: INoti): NotiDoc;
}

const NotiSchema = new mongoose.Schema({
  userFrom: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // the noti FROM the users
  userNoti: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // the noti FOR the users
  post: { type: mongoose.Schema.Types.ObjectId, refPath: "postType" },
  postType: {
    type: String,
    enum: ["Post", "Comment", "Request"],
  },
  notiContent: { type: mongoose.Schema.Types.ObjectId, ref: "Comment" },
  notiType: {
    type: String,
    required: true,
    enum: ["Liked", "Commented", "Requested", "Followed", "Accepted"],
  },
  created_at: { type: Date, default: Date.now },
});

NotiSchema.statics.build = (attr: INoti) => {
  return new Noti(attr);
};

const Noti = mongoose.model<NotiDoc, NotiModelInterface>("Noti", NotiSchema);

export { Noti };
