import mongo from "mongoose";
import dotenv from "dotenv";
import { ethers } from "ethers";
import { BlockIndexer } from "./BlockIndexer";
import { TransactionIndexer } from "./TransactionIndexer";
import path from "node:path";
import * as fs from "node:fs";
dotenv.config();

const maxBlocks = 10000

const indexer = async () => {
	try {
		await mongo.connect(process.env.DB_STRING as string, {
			dbName: process.env.DB_NAME as string,
		});
		console.log("Connected to MongoDB");
	} catch (err) {
		console.error("MongoDB connection error:", err);
	}

	const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
	// const debugProvider = new ethers.JsonRpcProvider(process.env.RPC_URL_DEBUG_TRACE)

	let ib = 1 // Infinity
	await provider.on("block", async (blockNumber) => {
		if(maxBlocks > 0 && ib > maxBlocks) return
		ib++
		const block = await provider.getBlock(blockNumber);
		if (!block) return;

		console.log(`Indexing block #${blockNumber}`);
		await new BlockIndexer(block).save();

		await Promise.all(
			block.transactions.map(async (hash) => {
				const [transaction, receipt] = await Promise.all([
					provider.getTransaction(hash),
					provider.getTransactionReceipt(hash)
				]);
				const txData = { ...transaction, ...receipt } as any
				if (transaction && receipt) {
					return new TransactionIndexer(txData, block).save()
				}
			})
		);

		console.log(`Indexed block #${blockNumber}`);
	});
};

indexer().catch(console.error);
