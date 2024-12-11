import WatchList from "../models/watchlist.model";
import User from "../models/user.model";
interface ISaveNewUserWithConfig {
  userName: string;
  chatId: string;
  percent: number;
  durations: string;
  watchLists: string[];
}
export class UserService {
  public async saveNewUserWithWatchList(data: ISaveNewUserWithConfig) {
    const { userName, chatId, percent, durations, watchLists } = data;
    const user = await User.findOneAndUpdate(
      { chatId, userName },
      {
        userName,
        chatId,
        percent,
        durations,
      },
      { upsert: true, returnDocument: "after" }
    );

    await WatchList.deleteMany({ user: user._id });

    WatchList.insertMany(
      watchLists.map((w) => ({ address: w, user: user._id }))
    );
  }

  public async getWatchList(chatId: string) {
    const user = await User.findOne({ chatId });
    const watchList = await WatchList.find({ user: user._id })
      .populate({ path: "user" })
      .exec();

    return { user, watchList };
  }
}
