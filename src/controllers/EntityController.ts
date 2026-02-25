import {Get, JsonController, Param, QueryParam} from 'routing-controllers';
import {Service} from "typedi";
import {EntityService} from "../services/EntityService";

@JsonController('/entity')
@Service()
export class EntityController {
	constructor(
		private readonly entityService: EntityService,
	) {}

	@Get('/resolve/:identifier')
	async resolveEntity(
		@Param('identifier') identifier: any,
		@QueryParam('full') full?: boolean,
	) {
		return await this.entityService.resolve(identifier, Number(full) === 1)
			.then(res => JSON.parse(JSON.stringify(res)))
	}
}