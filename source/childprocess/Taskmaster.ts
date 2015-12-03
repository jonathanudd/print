/// <reference path="../configuration/ServerConfiguration" />
/// <reference path="../configuration/RepositoryConfiguration" />
/// <reference path="Action" />
/// <reference path="ExecutionResult" />
/// <reference path="GitCommands" />

var child_process = require('child_process')
var fs = require("fs")

module Print.Childprocess {
	export class Taskmaster {
		private folderPath: string;
		private pullRequestNumber: number;
		private user: string;
		private primaryRepository: Childprocess.GitCommands;
		private secondaryRepository: Childprocess.GitCommands;
		private branch: string;
		private secondaryBranch: string;
		private repositoryConfiguration: RepositoryConfiguration;
		private actions: Action[] = [];
		constructor(path: string, private token: string, pullRequestNumber: number, user: string, name: string, private organization: string, branch: string) {
			this.pullRequestNumber = pullRequestNumber;
			this.folderPath = path + "/" + pullRequestNumber;
			this.user = user;
			this.primaryRepository = new Childprocess.GitCommands(token, this.pullRequestNumber,this.folderPath , this.user, name, organization);
			this.branch = branch;
		}
		readRepositoryConfiguration(repository: string) {
			var json = fs.readFileSync(this.pullRequestNumber + "/" + this.primaryRepository.name + "/" + repository + ".json", "utf-8");
			var repositoryConfiguration: RepositoryConfiguration = JSON.parse(json);
			return repositoryConfiguration;
		}
		readRepositoryConfigurationTMP(repositoryName: string): RepositoryConfiguration {
			var json = fs.readFileSync(repositoryName + ".json", "utf-8");
			var repositoryConfiguration: RepositoryConfiguration = JSON.parse(json);
			return repositoryConfiguration;
		}
		manage(): ExecutionResult[] {
			var gitResult: ExecutionResult[] = [];
			// Create folder
			if (!fs.existsSync(String(this.folderPath))) {
				fs.mkdirSync(String(this.folderPath));
			}

			// Clone, set upstream, fetch and merge primary repo
			if (!fs.existsSync(this.folderPath + '/' + this.primaryRepository.name)) {
				gitResult.push(new ExecutionResult("clone", this.primaryRepository.clone(this.primaryRepository.name, this.branch)));
				var pullResult = this.primaryRepository.pull(this.organization, this.primaryRepository.name, "master");
				if(pullResult == '-1') {
					this.primaryRepository.resetToFirstHead(this.primaryRepository.name);
				}
				gitResult.push(new ExecutionResult("pull upstream", pullResult));
				//gitResult.push(new ExecutionResult("pull upstream", this.primaryRepository.pull(this.organization, this.primaryRepository.name, "master")));
		}
			else {
				gitResult.push(new ExecutionResult("pull origin", this.primaryRepository.pull(this.user, this.primaryRepository.name, this.branch)));
				gitResult.push(new ExecutionResult("pull upstream", this.primaryRepository.pull(this.organization, this.primaryRepository.name, "master")));
			}

			// Read repository Configuration file in repo
			var repositoryConfiguration: RepositoryConfiguration = this.readRepositoryConfigurationTMP(this.primaryRepository.name);

			// Clone secondary repository
			if (!(repositoryConfiguration.secondary == 'none')) {
				this.secondaryRepository = new Childprocess.GitCommands(this.token, this.pullRequestNumber, this.folderPath, this.user, repositoryConfiguration.secondary, repositoryConfiguration.name);
				if (!fs.existsSync(this.folderPath + '/' + repositoryConfiguration.secondary)) {
					if(this.branch == "master") {
						gitResult.push(new ExecutionResult("clone secondary", this.secondaryRepository.cloneFromUser(repositoryConfiguration.secondaryUpstream, this.secondaryRepository.name,"master" )));
						this.secondaryBranch = "master";
					}
					else {
						var secondClone = this.secondaryRepository.clone(this.secondaryRepository.name, this.branch);
						if(secondClone == '-1') {
							gitResult.push(new ExecutionResult("clone secondary", this.secondaryRepository.cloneFromUser(repositoryConfiguration.secondaryUpstream, this.secondaryRepository.name,"master" )));
							this.secondaryBranch = "master";
						}
						else {
							gitResult.push(new ExecutionResult("clone secondary","0"));
							this.secondaryBranch = this.branch;
						}
					}
				}
				else {
					if(this.secondaryBranch != "master") {
						this.secondaryRepository.pull(this.user,this.secondaryRepository.name, this.secondaryBranch);
					}
					else {
						this.secondaryRepository.pull(repositoryConfiguration.secondaryUpstream,this.secondaryRepository.name, this.secondaryBranch)
					}
				}
			}

			//  Perform actions
			this.actions = repositoryConfiguration.actions;
			var output = gitResult.concat(this.executeActionList());
			return output;
		}
		createJSON(myClass: any) {
		}
		executeActionList(): ExecutionResult[] {
			var executionResult: ExecutionResult[] = [];
			for (var v in this.actions) {
				var action = this.actions[v];
				var result = this.executeAction(action);
				executionResult.push(new Print.Childprocess.ExecutionResult(action.task, result));
			}
			return executionResult;
		}
	executeAction(action: Action): string {
			var command = action.task;
			var args: string[] = [];
			var path: string = "";
			if (action.args) {
				var args = action.args.split(",");
			}
			if (action.path) {
				path = action.path;
			}
			if (action.dependency != 'none') {
				args.push(process.env['HOME'] + '/Video/' + action.dependency);
			}
			try {
				path = this.folderPath + "/" + this.primaryRepository.name + "/" + path;
				//var path = this.folderPath + "/" + this.primaryRepository.name;
				var child = child_process.spawnSync(action.task, args, { cwd: path });
				return child.status;
			}
			catch (ex) {
				return 'fail'
			}
		}
	}
}
