import mongoose, { Schema } from "mongoose";

const watchListSchema = new mongoose.Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    address: { type: String, required: true },
  },
  { timestamps: true }
);

const WatchList = mongoose.model("WatchList", watchListSchema);

export default WatchList;
