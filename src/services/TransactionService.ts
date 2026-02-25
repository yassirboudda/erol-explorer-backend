import {Service} from 'typedi';
import {Transaction, TransactionModel} from "../entities/Transaction";
import {ProviderService} from "./ProviderService";
import {ethers} from "ethers";
import {whatsabi} from "@shazow/whatsabi";
import mongoose from "mongoose";

@Service()
export class TransactionService {
	constructor(
		private readonly providerService: ProviderService,
	) {}

	async getTransaction(hash: string) {
		let tx = Object.assign({}, await TransactionModel.findOne({ hash }).lean());
		if(!tx?.hash) {
			tx = await this.fetchTransaction(hash)
		}
		return tx
	}

	async fetchTransaction(hash: string) {
		const provider = this.providerService.getProvider()
		const [transaction, receipt] = await Promise.all([
			provider.getTransaction(hash),
			provider.getTransactionReceipt(hash)
		]);
		const tx = { ...transaction, ...receipt } as any

		if(typeof tx.logs === 'undefined') {
			try {
				tx.logs = JSON.parse(JSON.stringify(Array(tx.logs)[0]))
				if(!tx.logs) tx.logs = []
			} catch { /**/ }
		}

		tx.method = await this.lookupSignature(tx.data)
		tx.timestamp = (await provider.getBlock(tx.blockNumber))?.timestamp ?? null

		if(tx.status === 0) tx.error = await this.resolveError(tx)

		return await this.saveTransaction(tx)
	}

	public async lookupSignature(txData: string) {
		const rawSignature = txData?.slice(0, 10) ?? '0x'
		try {
			const signatureLookup = new whatsabi.loaders.OpenChainSignatureLookup();
			const signature = await signatureLookup.loadFunctions(rawSignature)
			return signature.length && signature[0] !== '0x' ? signature[0] : null
		} catch (e) {
			return null
		}
	}

	async saveTransaction(
		tx: ethers.Transaction & ethers.TransactionReceipt & {
			method: string | null;
			timestamp: number | null;
			error?: string;
		}
	) {
		const txData = {
			hash: tx.hash,
			blockNumber: Number(tx.blockNumber),
			from: tx.from,
			to: tx.to,
			value: Number(tx.value),
			gasUsed: Number(tx.gasUsed),
			gasPrice: Number(tx.gasPrice),
			nonce: Number(tx.nonce),
			data: tx.data,
			status: Number(tx.status),
			error: tx.error,
			timestamp: tx.timestamp,
			method: tx.method,
			logs: tx.logs,
		}
		await TransactionModel.updateOne(
			{ hash: txData.hash },
			{ $set: txData },
			{ upsert: true }
		)
		return Object.assign({}, await TransactionModel.findOne({ hash: txData.hash }).lean())
	}

	async resolveError(tx: ethers.Transaction & ethers.TransactionReceipt) {
		const provider = this.providerService.getProvider()
		let error = null
		try {
			await provider.call({ ...tx, blockTag: tx.blockNumber - 1 });
		} catch (e: any) {
			error = e.shortMessage
		}
		return error
	}



	/** Other methods **/
	private getTransactionFilter(
		address?: string,
		additionalFilters: mongoose.FilterQuery<Transaction> = {}
	): mongoose.FilterQuery<Transaction> {
		const filter: mongoose.FilterQuery<Transaction> = {}
		if (address) {
			filter.$or = [
				{ from: address },
				{ to: address }
			]
		}
		Object.assign(filter, additionalFilters)
		return filter
	}

	async getTransactions(opts: {
		limit?: number;
		skip?: number;
		address?: string;
		blockNumber?: number | null;
	}) {
		opts.limit = Math.min(100, Math.max(1, opts.limit ?? 10)) // clamp(1, 100)
		opts.skip = isNaN(Number(opts.skip)) ? 0 : Number(opts.skip)
		opts.blockNumber = opts.blockNumber ?? null

		const filter = this.getTransactionFilter(opts.address, opts.blockNumber ? { blockNumber: opts.blockNumber } : {})

		return TransactionModel.find(filter)
			.limit(opts.limit)
			.skip(opts.skip)
			.sort({ blockNumber: -1 })
			.lean();
	}

	async count(opts: {
		limit?: number;
		skip?: number;
		address?: string;
	}) {
		opts.limit = Math.min(100, Math.max(1, opts.limit ?? 10)) // clamp(1, 100)
		opts.skip = isNaN(Number(opts.skip)) ? 0 : Number(opts.skip)

		const filter = this.getTransactionFilter(opts.address)
		return TransactionModel.countDocuments(filter)
	}

	async getChartTransactions(days: number) {
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - days);
		const startTimestamp = Math.floor(startDate.getTime() / 1000);

		return TransactionModel.aggregate([
			{
				$match: {
					timestamp: {$gte: startTimestamp}
				}
			},
			{
				$group: {
					_id: {
						$dateToString: {
							format: "%Y-%m-%d",
							date: {$toDate: {$multiply: ["$timestamp", 1000]}}
						}
					},
					count: {$sum: 1}
				}
			},
			{
				$project: {
					date: "$_id",
					count: 1,
					_id: 0
				}
			},
			{
				$sort: {date: 1}
			}
		]);
	}

	/**
	 * Get latest transaction hashes from indexed blocks (lightweight - no full tx indexing)
	 */
	async getLatestTxHashesFromBlocks(limit: number = 10) {
		const { BlockModel } = await import('../entities/Block');
		
		// Get recent blocks with transactions
		const blocks = await BlockModel.find({ transactions: { $exists: true, $ne: [] } })
			.sort({ number: -1 })
			.limit(20) // Get more blocks to ensure we have enough txs
			.lean();

		// Flatten transactions from blocks with metadata
		const txs: Array<{ hash: string; blockNumber: number; timestamp: number }> = [];
		for (const block of blocks) {
			for (const txHash of block.transactions || []) {
				if (typeof txHash === 'string') {
					txs.push({
						hash: txHash,
						blockNumber: block.number,
						timestamp: block.timestamp
					});
				}
			}
			if (txs.length >= limit) break;
		}

		return txs.slice(0, limit);
	}

}