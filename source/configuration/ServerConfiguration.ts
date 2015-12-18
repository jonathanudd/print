/// <reference path="../../typings/node/node" />

var fs = require("fs")

module Print {
	export class ServerConfiguration {
		clientId: string;
		clientSecret: string;
		baseUrl: string;
		authorizationToken: string;
		authorizationOrganization: string;
		authorizationTeam: string;
		maxRunningJobQueues: number;
		cookieSecret: string;
		serverPort: number;
		postToGithub: string;
		repos: RepositoryInformation[] = [];
		static readConfigurationFile(file: string): ServerConfiguration {
			var result: ServerConfiguration;
			try {
				result = <ServerConfiguration>JSON.parse(fs.readFileSync(file, "utf-8"));
			} catch (Error) {
				console.log("There was an error while reading the configuration file, unable to continue.\n" + Error.toString())
				process.exit(1); // TODO: Recover or crash and burn?
			}
			return result;
		}
	}
	export class RepositoryInformation {
		name: string;
		organization: string;
		secret: string;
	}
}
