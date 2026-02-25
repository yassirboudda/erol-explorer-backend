import mongo from "mongoose";
import dotenv from "dotenv";
import {ProviderService} from "../../src/services/ProviderService";
import {TransactionService} from "../../src/services/TransactionService";
import {BlockService} from "../../src/services/BlockService";
dotenv.config();

const providerService = new ProviderService();
const transactionService = new TransactionService(providerService);
const blockService = new BlockService(providerService);

const indexer = async () => {
	try {
		await mongo.connect(process.env.DB_STRING as string, {
			dbName: process.env.DB_NAME as string,
		});
		console.log("Connected to MongoDB");
	} catch (err) {
		console.error("MongoDB connection error:", err);
	}

	const provider = providerService.getProvider()

	await provider.on("block", async (blockNumber) => {
		console.log(`Indexing block #${blockNumber}`);
		const block = await blockService.getBlock(blockNumber)
		if (!block) return;

		await Promise.all(
			block.transactions.map(async (hash) => {
				await transactionService.getTransaction(hash)
			})
		);

		console.log(`Indexed block #${blockNumber}`);
	});
};

indexer().catch(console.error);
