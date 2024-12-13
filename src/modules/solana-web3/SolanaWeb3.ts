/* eslint-disable @typescript-eslint/no-explicit-any */
import { PublicKey, Connection as SolConnection } from "@solana/web3.js";
import WatchList from "../../models/watchlist.model";
import TxLogs from "../../models/tx-log.model";

export class SolanaWeb3 {
  private _connection: SolConnection;

  constructor() {
    console.log(
      new Date().toISOString() + " Constructor " + this.constructor.name
    );

    this._connection = new SolConnection(
      "https://solana-rpc.publicnode.com",
      "finalized"
    );
  }

  get connection() {
    return this._connection;
  }

  public async updateLastBlockHeight(blockSet: Set<number>) {
    try {
      const latestBlock = await this._connection.getSlot();

      if (blockSet.size === 0) {
        blockSet.add(latestBlock);

        return;
      }

      const currentSyncedBlock = [...blockSet][blockSet.size - 1];

      if (currentSyncedBlock > latestBlock) return;

      for (let height = currentSyncedBlock; height <= latestBlock; height++) {
        blockSet.add(height);
      }
    } catch (error) {
      console.log("updateLastBlockHeight", error);
    }
  }

  public async checkTransactions(blockSet: Set<number>) {
    if (blockSet.size <= 11) return;

    [...blockSet].slice(0, 10).map(async (block) => {
      try {
        blockSet.delete(block);
        const watchList = await WatchList.find();
        if (!watchList.length) return;

        const dataBlock = await this._connection.getBlock(block, {
          commitment: "finalized",
          rewards: false,
          transactionDetails: "accounts",
          maxSupportedTransactionVersion: 0,
        });

        if (!dataBlock?.transactions) return;

        for (const transaction of dataBlock.transactions) {
          if (!transaction?.meta?.postTokenBalances) continue;

          transaction.meta.postTokenBalances.map(async (balance) => {
            if (
              balance.mint === "So11111111111111111111111111111111111111112"
            ) {
              return;
            }

            const foundedWatchList = watchList.filter(
              (w) => w.address === balance.owner
            );

            if (foundedWatchList.length > 0) {
              foundedWatchList.map((w) => {
                TxLogs.findOneAndUpdate(
                  {
                    watchList: w.address,
                    address: balance.mint,
                  },
                  {
                    $set: {
                      address: balance.mint,
                      updatedAt: new Date(dataBlock.blockTime * 1000),
                    },
                  },
                  { upsert: true }
                ).exec();
              });
            }
          });
        }
      } catch (error) {
        console.log("checkTransactions", error);
      }
    });
  }

  public async listenOnLogs(watchList: any) {
    let pubKey: any;

    try {
      pubKey = new PublicKey(watchList.address);
    } catch (error) {
      console.log("listenOnLogs", error);
    }

    if (!pubKey) return;

    console.log(pubKey.toString());

    this._connection.onLogs(
      pubKey,
      async (logs) => {
        const signature = logs.signature;

        if (logs.err) return;

        const tx = await this._connection.getParsedTransaction(signature, {
          commitment: "finalized",
          maxSupportedTransactionVersion: 0,
        });

        tx?.meta?.postTokenBalances
          ?.filter(
            (b) =>
              b.owner === watchList.address &&
              b.mint !== "So11111111111111111111111111111111111111112"
          )
          .map(async (balance) => {
            console.log(
              balance.owner,
              balance.mint,
              new Date(tx.blockTime * 1000)
            );
            TxLogs.findOneAndUpdate(
              {
                watchList: watchList.address,
                address: balance.mint,
              },
              {
                $set: {
                  address: balance.mint,
                  updatedAt: new Date(tx.blockTime * 1000),
                },
              },
              { upsert: true }
            ).exec();
          });
      },
      "finalized"
    );
  }
}
