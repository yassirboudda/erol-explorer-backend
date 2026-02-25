import { getModelForClass, prop } from "@typegoose/typegoose";

export class Transaction {
	@prop({ required: true })
	hash: string;

	@prop()
	blockNumber: number;

	@prop()
	timestamp: number;

	@prop()
	from: string;

	@prop()
	to: string;

	@prop()
	value: number;

	@prop()
	gasUsed?: number;

	@prop()
	gasPrice?: number;

	@prop()
	nonce?: number;

	@prop()
	status?: number;

	@prop()
	error?: string;

	@prop()
	data?: any;

	@prop()
	method?: string;

	@prop()
	logs?: any;
}

export const TransactionModel = getModelForClass(Transaction);
