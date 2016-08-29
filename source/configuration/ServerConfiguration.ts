module Print {
	export class ServerConfiguration {
		private static serverConfiguration: ServerConfiguration;
		private config: any;

		getClientId(): string { return this.config.clientId; }
		getClientSecret(): string { return this.config.clientSecret; }
		getBaseUrl(): string { return this.config.baseUrl; }
		getAuthorizationToken(): string { return this.config.authorizationToken; }
		getAuthorizationOrganization(): string { return this.config.authorizationOrganization; }
		getAuthorizationTeam(): string { return this.config.authorizationTeam; }
		getMaxRunningJobQueues(): number { return this.config.maxRunningJobQueues; }
		getCookieSecret(): string { return this.config.cookieSecret; }
		getServerPort(): number { return this.config.serverPort; }
		getPostToGithub(): boolean { return this.config.postToGithub == "false" ? false : true; }
		getAdmin(): string { return this.config.admin; }
		getRepos(): RepositoryInformation[] { return <RepositoryInformation[]>this.config.repos; }
		getJobTimeout(): number { return this.config.jobTimeout * 1000; }
		getBranches(): any { return this.config.branches; }
		getName(): string {
			if (this.config. = "") {
				return "PRInt";
			}
			else {
				return this.config.name;
			}
		}

		static getServerConfig(): ServerConfiguration {
			if (!ServerConfiguration.serverConfiguration) {
				try {
					ServerConfiguration.serverConfiguration = new ServerConfiguration();
					ServerConfiguration.serverConfiguration.config = JSON.parse(fs.readFileSync("config.json", "utf-8"));
				}
				catch (Error) {
					console.log("There was an error while reading the configuration file, unable to continue.\n" + Error.toString());
					process.exit(1);
				}
			}
			return ServerConfiguration.serverConfiguration;
		}
	}

	export class RepositoryInformation {
		name: string;
		organization: string;
		secret: string;
	}
}
