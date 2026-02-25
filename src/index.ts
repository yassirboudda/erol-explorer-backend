import 'reflect-metadata';
import path from 'node:path'
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, '../.env')})

import { Action, createKoaServer, useContainer } from 'routing-controllers';
import { Container } from 'typedi';
import mongoose from "mongoose";

useContainer(Container);

const app = createKoaServer({
	controllers: [path.resolve(__dirname, './controllers/*.{js,ts}')],
	middlewares: [path.resolve(__dirname, './middlewares/*.{js,ts}')],
	interceptors: [path.resolve(__dirname, './interceptors/*.{js,ts}')],
	authorizationChecker: async (action: Action) => {
		// action.request.headers['authorization']
		return true
	}
});

const port = process.env.PORT ?? 3000;
app.listen(port, async () => {
	console.log(`> Listening on http://localhost:${port}`)
	console.log('> Starting database...')

	await mongoose.connect(process.env.DB_STRING as string, {
		dbName: process.env.DB_NAME,
	}).then(() => console.log('> Database connected'))
});