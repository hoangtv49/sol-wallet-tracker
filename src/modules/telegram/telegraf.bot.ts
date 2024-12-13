/* eslint-disable @typescript-eslint/no-explicit-any */
import WatchList from "../../models/watchlist.model";
import User from "../../models/user.model";
import { UserService } from "../../services/user.service";
import { Telegraf } from "telegraf";

export class TelegrafBot {
  private _bot: Telegraf;
  private _userService: UserService;

  constructor() {
    console.log(
      new Date().toISOString() + " Constructor " + this.constructor.name
    );
    this._userService = new UserService();
    this._initBot();
    this._handleMessageEvent();
    this.bot.launch();
  }

  public get bot() {
    if (!this._bot) {
      this._initBot();
    }

    return this._bot;
  }

  private _initBot() {
    this._bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
  }

  private _handleMessageEvent() {
    this._handleStart();
    this._handleGetWatchList();
    this._handleClearWatchList();
    this._handleNewWatchList();
  }

  private _handleStart() {
    this.bot.start((ctx) =>
      ctx.reply(
        `
<b>Setup Bot Configuration</b>
Please provide the following details:

1️⃣ <b>Percent</b>: (How many percent of addresses buy a token)
3️⃣ <b>Durations</b>: (Time to track: seconds or minutes or hours)
2️⃣ <b>Addresses</b>: (List of addresses to track, separated by new line)

<b>Example:</b>

10%
15 minutes
0x1234567890abcdef
0xabcdef1234567890`,
        { parse_mode: "HTML" }
      )
    );
  }

  private _handleNewWatchList() {
    this.bot.on("message", (ctx) => {
      const {
        message: {
          from: { id, username },
          text,
        },
      } = ctx as any;

      const configs = text.split("\n");
      const percent = configs[0].split("%")[0];
      const durations = configs[1];
      const addresses = configs.slice(2);

      if (!percent || !durations || !addresses.length) {
        ctx.reply("Invalid input");
        return;
      }

      this._userService.saveNewUserWithWatchList({
        chatId: id,
        durations,
        percent,
        userName: username,
        watchLists: addresses,
      });

      ctx.reply("Watch list saved. Type /watchlist to view.");
      throw Error("Restart");
    });
  }

  private _handleGetWatchList() {
    this.bot.command("watchlist", async (ctx) => {
      const { user, watchList } = await this._userService.getWatchList(
        ctx.message.from.id as any
      );

      if (!watchList.length) {
        ctx.reply("Watch list is empty.");
        return;
      }

      ctx.reply(`
${user.percent}%
${user.durations}
${watchList.map((w) => w.address).join("\n")}
`);
    });
  }

  private _handleClearWatchList() {
    this.bot.command("clear", async (ctx) => {
      const user = await User.findOne({ chatId: ctx.from.id }).exec();

      if (user) WatchList.deleteMany({ user: user._id }).exec();

      ctx.reply("Watch list cleared.");
      throw Error("Restart");
    });
  }
}
