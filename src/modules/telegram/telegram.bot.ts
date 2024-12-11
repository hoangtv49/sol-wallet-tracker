import { Telegram } from "telegraf";

export class TelegramBot {
  private _bot: Telegram;

  constructor() {
    console.log("Constructor " + this.constructor.name);

    this._initBot();
    this._initCommand();
  }

  public get bot() {
    if (!this._bot) {
      this._initBot();
    }

    return this._bot;
  }

  private _initBot() {
    this._bot = new Telegram(process.env.TELEGRAM_BOT_TOKEN);
  }

  private _initCommand() {
    this._bot.setMyCommands([
      { command: "/start", description: "Start" },
      { command: "/watchlist", description: "View all watch list." },
      { command: "/clear", description: "Clear watch list." },
    ]);
  }
}
