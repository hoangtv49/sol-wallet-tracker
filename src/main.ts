import mongoose from "mongoose";
import { TelegrafBot, TelegramBot } from "./modules";
import * as dotenv from "dotenv";
dotenv.config();

class Crawler {
  private readonly _telegramBot: TelegramBot;
  private readonly _telegrafBot: TelegrafBot;

  constructor() {
    console.log("Constructor " + this.constructor.name);

    this._telegrafBot = new TelegrafBot();
    this._telegramBot = new TelegramBot();
  }

  public async start() {
    await this.initDBConnection();
  }

  private async initDBConnection() {
    try {
      await mongoose.connect(process.env.MONGODB_CONNECT_STRING);

      console.log("Connected");
    } catch (e) {
      console.log(e);
    }
  }
}

const newCrawler = new Crawler();

newCrawler.start();
