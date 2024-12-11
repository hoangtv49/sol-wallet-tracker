import { Telegraf, Telegram } from "telegraf";
interface ISolanaWeb3Constructor {
  token: string;
}

export class SolanaWeb3 {
  private _bot: Telegram;
  private _botContext: Telegraf;

  constructor(config: ISolanaWeb3Constructor) {
    console.log("Constructor " + this.constructor.name);

    if (!config.token) {
      config.token = process.env.TELEGRAM_BOT_TOKEN as string;
    }

    this._bot = new Telegram(config.token);
    this._botContext = new Telegraf(config.token);
  }

  get bot() {
    return this._bot;
  }

  get botContext() {
    return this._botContext;
  }
}
