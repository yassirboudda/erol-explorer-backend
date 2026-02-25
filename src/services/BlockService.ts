import {Service} from "typedi";
import {ProviderService} from "./ProviderService";
import {BlockModel} from "../entities/Block";
import {ethers} from "ethers";

@Service()
export class BlockService {
	constructor(
		private readonly providerService: ProviderService,
	) {
	}

	async getBlocks(opts: {
		limit?: number;
		skip?: number;
	}) {
		opts.limit = Math.min(100, Math.max(1, opts.limit ?? 10)) // clamp(1, 100)
		opts.skip = isNaN(Number(opts.skip)) ? 0 : Number(opts.skip)
		return BlockModel.find()
			.skip(opts.skip)
			.limit(opts.limit)
			.sort({ number: -1 })
			.lean();
	}

	async count() {
		return BlockModel.countDocuments()
	}

	async getBlock(identifier: string | number) {
		const provider = this.providerService.getProvider()
		if(typeof identifier === "string" && !identifier.startsWith('0x')) {
			identifier = Number(identifier)
		}
		try {
			const block = await provider.getBlock(identifier, true)
			return block ? await this.save(block) : null
		} catch (e) {
			console.error(e)
			return null
		}
	}

	async save(block: ethers.Block) {
		const blockData = {
			number: Number(block.number),
			hash: block.hash,
			parentHash: block.parentHash,
			timestamp: Number(block.timestamp),
			gasLimit: Number(block.gasLimit),
			gasUsed: Number(block.gasUsed),
			transactions: block.transactions,
		}

		// @TODO Save txs

		await BlockModel.updateOne(
			{ number: blockData.number },
			{ $set: blockData },
			{ upsert: true }
		)
		return Object.assign({}, await BlockModel.findOne({ number: blockData.number }).lean(), { transactions: block.prefetchedTransactions })
	}
}