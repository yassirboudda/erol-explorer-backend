import {Service} from 'typedi';
import {ethers} from "ethers";
import {ProviderService} from "./ProviderService";
import {TransactionService} from "./TransactionService";
import {ContractService} from "./ContractService";
import {BlockService} from "./BlockService";

@Service()
export class EntityService {
	constructor(
		private readonly providerService: ProviderService,
		private readonly transactionService: TransactionService,
		private readonly contractService: ContractService,
		private readonly blockService: BlockService,
	) {}

	async resolve(identifier: any, full?: boolean) {
		const result: {
			data: any;
			kind: string;
			transactions?: ethers.Transaction[];
		} = { data: null, kind: 'address' }
		const provider = this.providerService.getProvider()

		if(identifier?.startsWith('0x') && ethers.isAddress(identifier)) {
			// Address
			const address = ethers.getAddress(identifier);
			if(address?.length) result.kind = 'address'

			const [ bytecode, balance ] = await Promise.all([
				provider.getCode(address).catch(() => ''),
				provider.getBalance(address).catch(() => ''),
			])

			// Contract
			const isContract = bytecode.length > 0 && bytecode !== '0x'
			if(isContract) {
				result.kind = 'contract'
				result.data = await this.contractService.getContract(address);
				result.data.bytecode = bytecode
			} else {
				result.data = {}
			}

			result.data.address = address
			result.data.balance = Number(balance) / 10**18

		} else if(ethers.isHexString(identifier, 32)) {

			// Transaction
			result.data = await this.transactionService.getTransaction(identifier);

			if(result.data?.hash) {
				result.kind = 'tx'
			} else {
				result.kind = 'block'
				result.data = await this.blockService.getBlock(identifier);
			}

		} else if(!isNaN(Number(identifier))) {

			// Block
			result.kind = 'block'
			result.data = await this.blockService.getBlock(identifier);
			try {
				result.transactions = JSON.parse(JSON.stringify(result.data.prefetchedTransactions ?? []))
			} catch (e) { console.error(e) }

		}

		return result
	}
}