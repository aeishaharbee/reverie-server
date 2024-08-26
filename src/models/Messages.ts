import mongoose from "mongoose";

interface IMessages {
  sender: mongoose.Schema.Types.ObjectId;
  receiver: mongoose.Schema.Types.ObjectId;
  message: string;
  timestamp: Date;
}

interface MessagesDoc extends mongoose.Document {
  sender: mongoose.Schema.Types.ObjectId;
  receiver: mongoose.Schema.Types.ObjectId;
  message: string;
  timestamp: Date;
}

interface MessagesModelInterface extends mongoose.Model<MessagesDoc> {
  build(attr: IMessages): MessagesDoc;
}

const MessagesSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  message: { type: String },
  timestamp: { type: Date },
});

MessagesSchema.statics.build = (attr: IMessages) => {
  return new Messages(attr);
};

const Messages = mongoose.model<MessagesDoc, MessagesModelInterface>(
  "Messages",
  MessagesSchema
);

export { Messages };
