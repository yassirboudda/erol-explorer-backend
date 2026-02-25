import {getModelForClass, prop} from "@typegoose/typegoose";

export class Block {
	@prop({ required: true })
	number: number;

	@prop()
	hash: string;

	@prop()
	parentHash: string;

	@prop()
	timestamp: number;

	@prop()
	gasLimit: number;

	@prop()
	gasUsed: number;

	@prop()
	transactions: string[];
}

export const BlockModel = getModelForClass(Block);