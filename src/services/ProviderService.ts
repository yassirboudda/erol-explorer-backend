import {Service} from 'typedi';
import {ethers} from "ethers";

@Service()
export class ProviderService {
	public provider: ethers.JsonRpcProvider;

	constructor() {}

	getProvider() {
		if (!this.provider) {
			this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL)
		}
		return this.provider;
	}
}