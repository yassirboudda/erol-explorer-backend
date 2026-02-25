import { ethers } from "ethers";
import { Transaction, TransactionModel } from "../../src/entities/Transaction";
import { whatsabi } from "@shazow/whatsabi";

export class TransactionIndexer extends Transaction {
	constructor(tx: (ethers.TransactionResponse & ethers.TransactionReceipt) | Transaction, block: ethers.Block) {
		super()
		if(tx) {
			if(!(tx instanceof Transaction)) {
				Object.assign(this, this.parse(tx))
			}
			this.timestamp = block.timestamp
		}
	}

	public async save() {
		await this.lookupSignature()
		if(this.hash?.length) {
			await TransactionModel.updateOne(
				{ hash: this.hash },
				{ $set: { ...this } },
				{ upsert: true }
			)
		}
	}

	public parse(tx: ethers.TransactionResponse & ethers.TransactionReceipt) {
		return tx ? {
			hash: tx.hash,
			blockNumber: Number(tx.blockNumber),
			from: tx.from,
			to: tx.to,
			value: Number(tx.value),
			gasUsed: Number(tx.gasUsed),
			gasPrice: Number(tx.gasPrice),
			nonce: Number(tx.nonce),
			data: tx.data,
			status: Number(tx.status)
		} : null
	}

	public async lookupSignature() {
		try {
			const signatureLookup = new whatsabi.loaders.OpenChainSignatureLookup();
			const rawSignature = this.data?.slice(0, 10) ?? '0x'
			const signature = await signatureLookup.loadFunctions(rawSignature)
			if(signature.length && signature[0] !== '0x') {
				this.method = signature[0]
			}
		} catch (e) {
			console.warn(`Signature lookup failed for tx ${this.hash}`)
		}
	}
}
