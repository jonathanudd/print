/// <reference path="../../typings/node/node" />

var fs = require("fs")

module Print {
	export class ServerConfiguration {
		name: string;
		secret: string;
		static readConfigurationFile(file: string): ServerConfiguration[] {
			return <ServerConfiguration[]>JSON.parse(fs.readFileSync(file, "utf-8"));
		}
	}
}
