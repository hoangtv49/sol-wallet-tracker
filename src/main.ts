import mongoose from "mongoose";
import { SolanaWeb3, TelegrafBot, TelegramBot } from "./modules";
import * as dotenv from "dotenv";
import User from "./models/user.model";
import WatchList from "./models/watchlist.model";
import TxLogs from "./models/tx-log.model";
import _ from "lodash";
import dayjs from "dayjs";

dotenv.config();

class Crawler {
  private readonly _telegramBot: TelegramBot;
  private readonly _telegrafBot: TelegrafBot;
  private readonly _solanaWeb3: SolanaWeb3;

  private readonly _blockSet = new Set<number>();
  constructor() {
    console.log(new Date().toISOString() + " Constructor " + this.constructor.name);

    this._telegrafBot = new TelegrafBot();
    this._telegramBot = new TelegramBot();
    this._solanaWeb3 = new SolanaWeb3();
  }

  public async start() {
    await this._initDBConnection();
    this._solanaWeb3.updateLastBlockHeight(this._blockSet);
    setInterval(
      () => this._solanaWeb3.updateLastBlockHeight(this._blockSet),
      5000
    );
    setInterval(() => this._solanaWeb3.checkTransactions(this._blockSet), 2500);
    setInterval(() => this._handlePushNotification(), 5000);
  }

  private async _initDBConnection() {
    try {
      await mongoose.connect(process.env.MONGODB_CONNECT_STRING);

      console.log("Connected");
    } catch (e) {
      console.log(e);
    }
  }

  private async _handlePushNotification() {
    const users = await User.find({});
    users.map(async (user) => {
      const watchLists = await WatchList.find({ user: user._id });
      const { percent, durations } = user;
      const [time, unit] = durations.split(" ") as [
        number,
        "seconds" | "minutes" | "hours"
      ];

      const logs = await TxLogs.find({
        watchList: { $in: watchLists.map((w) => w.address) },
        updatedAt: {
          $gte: dayjs().subtract(time, unit).toDate(),
        },
        $or: [
          {
            lastSentNotification: {
              $lt: dayjs().subtract(time, unit).toDate(),
            },
          },
          { lastSentNotification: { $eq: null } },
        ],
      });

      const grouped = _.groupBy(logs, "address");

      for (const [key, val] of Object.entries(grouped)) {
        const foundedPercent = (val.length * 100) / watchLists.length;

        if (foundedPercent >= percent) {
          await TxLogs.findOneAndUpdate(
            { address: key, watchList: val[0].watchList },
            { lastSentNotification: new Date() }
          );

          this._telegramBot.bot.sendMessage(
            user.chatId,
            `
🚨 <b>${key}</b> 🚨 

Was bought by <b>${foundedPercent}%</b> of watch list:

${val.map((v) => v.watchList).join("\n")}`,
            { parse_mode: "HTML" }
          );
        }
      }
    });
  }
}

const newCrawler = new Crawler();

newCrawler.start();
