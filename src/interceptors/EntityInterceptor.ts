import { Action, Interceptor, InterceptorInterface } from "routing-controllers";
import { Service } from "typedi";

@Service()
@Interceptor()
export class EntityInterceptor implements InterceptorInterface {
	intercept(action: Action, content: any): any {
		return this.clean(content);
	}

	private clean(obj: any): any {
		if (!obj || typeof obj !== 'object') return obj;

		if (Array.isArray(obj)) return obj.map(this.clean.bind(this));

		const { _id, __v, ...rest } = obj;

		return Object.fromEntries(
			Object.entries(rest).map(([key, value]) => [key, this.clean(value)])
		);
	}
}
