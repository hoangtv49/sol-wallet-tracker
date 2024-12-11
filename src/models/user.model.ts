import mongoose, { Schema } from "mongoose";

const userSchema = new mongoose.Schema(
  {
    userName: { type: String, required: true },
    chatId: { type: String, required: true },
    percent: { type: Number, required: true },
    durations: { type: String, required: true },
    watchLists: { type: Schema.Types.ObjectId, ref: "WatchList" },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
