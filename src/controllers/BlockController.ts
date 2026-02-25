import {Get, JsonController, Param, QueryParam} from 'routing-controllers';
import {Service} from "typedi";
import {BlockService} from "../services/BlockService";

@JsonController('/block')
@Service()
export class BlockController {
	constructor(
		private readonly blockService: BlockService,
	) {}

	@Get('s') // route: /blocks
	async getBlocks(
		@QueryParam('limit') limit?: number,
		@QueryParam('skip') skip?: number,
	) {
		return await this.blockService.getBlocks({ limit, skip })
	}

	@Get('s/count') // route: /blocks/count
	async countBlocks() {
		return await this.blockService.count();
	}
}