import {Service} from "typedi";
import {ethers} from "ethers";
import {SourcifyService} from "./SourcifyService";
import {ProviderService} from "./ProviderService";

@Service()
export class ContractService {
	constructor(
		private readonly providerService: ProviderService,
		private readonly sourcifyService: SourcifyService,
	) {
	}

	public async getContract(address: string) {
		const provider = this.providerService.getProvider()
		let data = await this.sourcifyService.getSource(address)
		if(!data) data = {}
		if(data.proxyResolution?.implementations?.length) {
			const promises = data.proxyResolution.implementations
				.map((impl: { address: string, name: string }) => this.sourcifyService.getSource(impl.address))
			data.proxies = await Promise.all(promises)
		}
		data.name = data.proxies?.[0]?.compilation?.name ?? data.compilation?.name ?? ''
		try {
			const contract = new ethers.Contract(address, data.proxies?.[0]?.abi ?? data.abi, provider)
			data.name = await contract.name()
		} catch { /**/ }
		return data
	}
}