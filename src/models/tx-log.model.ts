import mongoose from "mongoose";

const txLogsSchema = new mongoose.Schema(
  {
    watchList: { type: String, ref: "WatchList" },
    address: { type: String, required: true },
    lastSentNotification: { type: Date, default: null },
  },
  { timestamps: true }
);

txLogsSchema.index({ watchList: 1, address: 1 }, { unique: true });

const TxLogs = mongoose.model("TxLog", txLogsSchema);

export default TxLogs;
