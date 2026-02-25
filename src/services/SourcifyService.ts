import {Service} from "typedi";

@Service()
export class SourcifyService {

	async request(path: string, data?: any) {
		try {
			const opts: RequestInit = {
				headers: { "content-type": "application/json" }
			}
			opts.method = data ? 'POST' : 'GET';
			if(data) opts.body = JSON.stringify(data)
			return await fetch(`${process.env.SOURCIFY_API_URL ?? ''}/${path}`, opts)
				.then(res => res.json())
		} catch (e) {
			return null
		}
	}

	async getSource(address: string, fields = 'all') {
		const chainId = process.env.CHAIN_ID
		return await this.request(`/v2/contract/${chainId}/${address}?fields=${fields}`)
	}

}