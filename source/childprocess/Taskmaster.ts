/// <reference path="../ServerConfiguration" />
/// <reference path="../RepositoryConfiguration" />
/// <reference path="../Action" />
/// <reference path="../ExecutionResult" />
/// <reference path="GitCommands" />
var execSync = require('child_process').execSync
var exec = require('child_process').exec
var fs = require("fs")
module Print.Childprocess {
	export class Taskmaster  {
		private pullRequestNumber: string;
		private user: string;
		private primaryRepo: ServerConfiguration
		private secondaryRepo: ServerConfiguration
		private branch: string;
		private gitCommands: Childprocess.GitCommands;
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
			if (!fs.existsSync(this.pullRequestNumber)){
			    fs.mkdirSync(this.pullRequestNumber);
			}
			// Clone, set upstream, fetch and merge primary repo
			if (!fs.existsSync(this.pullRequestNumber + '/' + this.primaryRepo.name)){
				this.setup(this.primaryRepo.name, this.branch, this.primaryRepo.upstream);
			}
			// for testing only remove TMP!!!!!!!!!!!!
			// Read repository Configuration file in repo
			this.readRepositoryConfigurationTMP(this.primaryRepo.name);
			// Clone secondary repository
			if (!fs.existsSync(this.pullRequestNumber + '/' + this.repositoryConfiguration.secondary)){
				this.setup(this.repositoryConfiguration.secondary, this.branch, this.repositoryConfiguration.secondaryUpstream);
			}
			//  Perform actions
			var actionResult = this.executeActionList();
			//console.log(actionResult);
			var json = JSON.stringify(actionResult);
			console.log(json);;
		}
		createJSON(myClass : any) {
		}
		executeActionList() : ExecutionResult[]  {
			var executionResult: ExecutionResult[] = [];
			for (var v in this.repositoryConfiguration.actions) {
				var action = this.repositoryConfiguration.actions[v];
				var result = this.executeAction(action);
				executionResult.push(new Print.ExecutionResult(action.task,result));
			}
			return executionResult;
		}
		executeAction(action: Action) : string {
			var command = 'cd ' + this.pullRequestNumber + '/' + this.primaryRepo.name + ' && ';
			if (action.dependency == 'none') {
				command = command + action.task;
			}
			else {
				command = command + action.task + ' ' +  __dirname + '/../video/' + action.dependency;
			}
			var outputValue = execSync(command);
			var outputArray = String(outputValue).split('\n');
			var returnValue = outputArray[outputArray.length -2]
			return returnValue;
		}
	}
}
