import mongoose from "mongoose";

interface IRequest {
  userRequestee: mongoose.Schema.Types.ObjectId;
  userRequested: mongoose.Schema.Types.ObjectId;
  isApproved: boolean;
  dateRequested: Date;
  dateApproved: Date;
}

interface RequestDoc extends mongoose.Document {
  userRequestee: mongoose.Schema.Types.ObjectId;
  userRequested: mongoose.Schema.Types.ObjectId;
  isApproved: boolean;
  dateRequested: Date;
  dateApproved: Date;
}

interface RequestModelInterface extends mongoose.Model<RequestDoc> {
  build(attr: IRequest): RequestDoc;
}

const RequestSchema = new mongoose.Schema({
  userRequestee: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  userRequested: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  isApproved: { type: Boolean, default: false },
  dateRequested: { type: Date, default: Date.now },
  dateApproved: { type: Date },
});

RequestSchema.statics.build = (attr: IRequest) => {
  return new Request(attr);
};

const Request = mongoose.model<RequestDoc, RequestModelInterface>(
  "Request",
  RequestSchema
);

export { Request };
