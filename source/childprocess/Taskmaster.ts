/// <reference path="../ServerConfiguration" />
/// <reference path="../RepositoryConfiguration" />
/// <reference path="../Action" />
/// <reference path="GitCommands" />
var execSync = require('child_process').execSync
var fs = require("fs")
module Print.Childprocess {
	export class Taskmaster  {
		private pullRequestNumber: string;
		private user: string;
		private primaryRepository: string;
		private secondaryRepository: string;
		private primaryRepo: ServerConfiguration
		private secondaryRepo: ServerConfiguration
		private branch: string;
		private gitCommands: Childprocess.GitCommands;
		private commands: string;
		private repositoryConfiguration: RepositoryConfiguration
		constructor(pullRequestNumber: string, user: string,primaryRepo: ServerConfiguration, branch: string) {
			this.pullRequestNumber = pullRequestNumber;
			this.user = user;
			this.primaryRepo = primaryRepo;
			this.branch = branch;
			this.gitCommands = new Childprocess.GitCommands(this.pullRequestNumber, this.user);
		}
		setup(repository: string, branch: string, upstream: string) {
			this.gitCommands.clone(repository, branch);
			this.gitCommands.setUpstream(repository, upstream);
			this.gitCommands.fetch(repository);
			this.gitCommands.merge(repository);
		}
		readRepositoryConfiguration(repository: string) {
			var json = fs.readFileSync(this.pullRequestNumber +"/"+ this.primaryRepo.name +"/"+ repository+".json", "utf-8");
			this.repositoryConfiguration = JSON.parse(json);
		}
		readRepositoryConfigurationTMP(repository: string) {
			var json = fs.readFileSync(repository+".json", "utf-8");
			this.repositoryConfiguration = JSON.parse(json);
		}
		manage() {
			// Create folder
			execSync('mkdir ' + this.pullRequestNumber, (error: any, stdout: any, stderr: any) => {});

			// Clone, set upstream, fetch and merge primary repo
			this.setup(this.primaryRepo.name, this.branch, this.primaryRepo.upstream);

			// for testing only remove TMP!!!!!!!!!!!!
			// Read repository Configuration file in repo
			this.readRepositoryConfigurationTMP(this.primaryRepo.name);

			// Clone secondary repository
			this.setup(this.repositoryConfiguration.secondary, this.branch, this.repositoryConfiguration.secondaryUpstream);

			//  Perform actions
			this.executeActionList();
		}
		executeActionList() {
			for (var v in this.repositoryConfiguration.actions) {
				this.executeAction(this.repositoryConfiguration.actions[v]);
			}
		}
		executeAction(action: Action) {
			var command = 'cd ' + this.pullRequestNumber + '/' + this.primaryRepo.name + ' && ';
			if (action.dependency == 'none') {
				command = command + action.task;
			}
			else {
				command = command + action.task + ' ' +  __dirname + '/../video/' + action.dependency;
			}
			execSync(command,
			(error: any, stdout: any, stderr: any) => {
				console.log('stdout: ' + stdout)
				console.log('stderr: ' + stderr)
				if (error !== null) {
					console.log('exec error: ' + error)
				}
			})
		}
	}
}
