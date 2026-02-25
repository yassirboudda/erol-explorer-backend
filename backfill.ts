import mongo from "mongoose";
import dotenv from "dotenv";
import {ProviderService} from "./src/services/ProviderService";
import {TransactionService} from "./src/services/TransactionService";
import {BlockService} from "./src/services/BlockService";
dotenv.config();

const providerService = new ProviderService();
const transactionService = new TransactionService(providerService);
const blockService = new BlockService(providerService);

const backfill = async () => {
    await mongo.connect(process.env.DB_STRING as string, {
        dbName: process.env.DB_NAME as string,
    });
    console.log("Connected to MongoDB");

    const provider = providerService.getProvider();
    const latestBlock = await provider.getBlockNumber();
    console.log("Latest chain block:", latestBlock);

    for (let i = 1; i <= latestBlock; i++) {
        try {
            const block = await blockService.getBlock(i);
            if (!block) {
                console.log("Block", i, "not found on chain");
                continue;
            }
            await Promise.all(
                block.transactions.map(async (hash: string) => {
                    await transactionService.getTransaction(hash);
                })
            );
            console.log("Indexed block #" + i);
        } catch (err) {
            console.error("Error indexing block", i, err);
        }
    }
    console.log("Backfill complete!");
    process.exit(0);
};

backfill().catch(console.error);
