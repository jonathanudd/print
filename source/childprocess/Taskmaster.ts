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
		private primaryRepo: Childprocess.GitCommands;
		private secondaryRepo: Childprocess.GitCommands;
		private branch: string;
		private repositoryConfiguration: RepositoryConfiguration
		constructor(pullRequestNumber: string, user: string,name: string, organization: string, branch: string) {
			this.pullRequestNumber = pullRequestNumber;
			this.user = user;
			this.primaryRepo = new Childprocess.GitCommands(this.pullRequestNumber, this.user, name, organization);
			this.branch = branch;
		}
		setup(repository: Childprocess.GitCommands, branch: string) {
			repository.clone(repository.name, branch);
			repository.setUpstream(repository.name, repository.organization);
			repository.fetch(repository.name);
			repository.merge(repository.name);
		}
		readRepositoryConfiguration(repository: string) {
			var json = fs.readFileSync(this.pullRequestNumber +"/"+ this.primaryRepo.name +"/"+ repository+".json", "utf-8");
			this.repositoryConfiguration = JSON.parse(json);
		}
		readRepositoryConfigurationTMP(repositoryName: string) : RepositoryConfiguration {
			var json = fs.readFileSync(repositoryName+".json", "utf-8");
			var secondaryRepository: RepositoryConfiguration = JSON.parse(json);
			return secondaryRepository;
			//this.repositoryConfiguration = JSON.parse(json);
		}
		manage() {
			// Create folder
			if (!fs.existsSync(this.pullRequestNumber)){
			    fs.mkdirSync(this.pullRequestNumber);
			}
			// Clone, set upstream, fetch and merge primary repo
			if (!fs.existsSync(this.pullRequestNumber + '/' + this.primaryRepo.name)){
				this.setup(this.primaryRepo, this.branch);
			}
			// for testing only remove TMP!!!!!!!!!!!!
			// Read repository Configuration file in repo
			this.readRepositoryConfigurationTMP(this.primaryRepo.name);
			var secondaryRepositoryConfiguration: RepositoryConfiguration = this.readRepositoryConfigurationTMP(this.primaryRepo.name);
			// Clone secondary repository
			if (!fs.existsSync(this.pullRequestNumber + '/' + secondaryRepositoryConfiguration.secondary)){
				this.secondaryRepo = new Childprocess.GitCommands(this.pullRequestNumber, this.user,secondaryRepositoryConfiguration.secondary ,secondaryRepositoryConfiguration.secondaryUpstream );
				this.setup(this.secondaryRepo, this.branch);
			}
			//  Perform actions
			//var actionResult = this.executeActionList();
			//console.log(actionResult);
			//var json = JSON.stringify(actionResult);
			//console.log(json);;
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
