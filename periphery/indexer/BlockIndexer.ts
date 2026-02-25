import { ethers } from "ethers";
import { Block, BlockModel } from "../../src/entities/Block";

export class BlockIndexer extends Block {
	constructor(block: ethers.Block | null) {
		super()
		if(block) {
			Object.assign(this, this.parse(block))
		}
	}

	public async save() {
		await this.aggregate()
		const existingBlock = await BlockModel.findOne({ number: this.number })
		if(existingBlock) return
		await BlockModel.create(this)
	}

	public parse(block: ethers.Block) {
		return {
			number: Number(block.number),
			hash: block.hash,
			parentHash: block.parentHash,
			timestamp: Number(block.timestamp),
			gasLimit: Number(block.gasLimit),
			gasUsed: Number(block.gasUsed),
			transactions: block.transactions,
		}
	}

	public async aggregate() {
		// @TODO Add decoded tx data via whatsabi
	}
}