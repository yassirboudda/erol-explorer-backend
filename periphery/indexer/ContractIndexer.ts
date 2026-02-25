import {Contract, ContractModel} from '../../src/entities/Contract';
import {ethers} from "ethers";
import {whatsabi} from "@shazow/whatsabi";

export class ContractIndexer extends Contract {
	private provider

	constructor(address: string, provider?: ethers.JsonRpcProvider) {
		super()
		this.address = address;
		if(provider) this.provider = provider;
	}

	public async save() {
		if(!this.provider) {
			this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL)
		}
		const code = await this.provider.getCode(this.address);
		if(code !== '0x' && code !== '0x0') { // Is contract
			await this.aggregate()
			// @TODO Check if it's erc20
			await ContractModel.updateOne(
				{ address: this.address },
				{ $set: { abi: this.abi }, $setOnInsert: { address: this.address } },
				{ upsert: true }
			)
		}
	}

	private async aggregate() {
		if(!this.provider) return;
		try {
			const abiResult = await whatsabi.autoload(this.address, {
				provider: this.provider,
				enableExperimentalMetadata: true,
				followProxies: false,
			});
			const abiResultProxied = await whatsabi.autoload(this.address, {
				provider: this.provider,
				enableExperimentalMetadata: true,
				followProxies: true,
			});
			if(typeof abiResult?.abi !== 'undefined' && typeof abiResultProxied?.abi !== 'undefined') {
				this.abi = Object.fromEntries(
					Object.entries(abiResultProxied.abi)
						.map(([k, v]: any) => {
							if(Object.keys(abiResult.abi).includes(k)) {
								v.proxied = false;
							} else {
								v.proxied = true;
							}
							return [k, v];
						})
				);
			}
		} catch (e) {
			/**/
		}
	}
}