import {Get, JsonController, Param, QueryParam} from 'routing-controllers';
import {Service} from "typedi";
import {TransactionService} from "../services/TransactionService";
import {BlockService} from "../services/BlockService";

@JsonController('/transaction')
@Service()
export class TransactionController {
	constructor(
		private readonly transactionService: TransactionService,
		private readonly blockService: BlockService,
	) {}

	@Get('s/latest-hashes') // route: /transactions/latest-hashes
	async getLatestTransactionHashes(
		@QueryParam('limit') limit: number = 10
	) {
		return await this.transactionService.getLatestTxHashesFromBlocks(limit);
	}

	@Get('s') // route: /transactions
	async getTransactions(
		@QueryParam('limit') limit?: number,
		@QueryParam('skip') skip?: number,
		@QueryParam('address') address?: string,
		@QueryParam('blockNumber') blockNumber?: number,
	) {
		return await this.transactionService.getTransactions({ limit, skip, address, blockNumber })
	}

	@Get('s/count') // route: /transactions/count
	async countTransactions(
		@QueryParam('limit') limit?: number,
		@QueryParam('skip') skip?: number,
		@QueryParam('address') address?: string,
	) {
		return await this.transactionService.count({ limit, skip, address });
	}

	@Get('s/chart') // route: /transactions/chart
	async getChartTransactions(
		@QueryParam('days') days: number = 7
	) {
		return await this.transactionService.getChartTransactions(days);
	}
}