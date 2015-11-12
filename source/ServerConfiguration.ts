module Print {
	export class ServerConfiguration {
		name: string;
		secret: string;
		upstream: string;
		constructor(name: string, secret: string, upstream: string) {
			this.name = name;
			this.secret = secret;
			this.upstream = upstream;
		}
	}
}
