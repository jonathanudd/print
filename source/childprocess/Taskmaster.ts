/// <reference path="../ServerConfiguration" />
/// <reference path="../RepositoryConfiguration" />
/// <reference path="../Action" />
/// <reference path="../ExecutionResult" />
/// <reference path="GitCommands" />
var execSync = require('child_process').execSync
var fs = require("fs")
module Print.Childprocess {
	export class Taskmaster  {
		private pullRequestNumber: string;
		private user: string;
		private primaryRepository: Childprocess.GitCommands;
		private secondaryRepository: Childprocess.GitCommands;
		private branch: string;
		private repositoryConfiguration: RepositoryConfiguration
		private actions: Action[];
		constructor(pullRequestNumber: string, user: string,name: string, organization: string, branch: string) {
			this.pullRequestNumber = pullRequestNumber;
			this.user = user;
			this.primaryRepository = new Childprocess.GitCommands(this.pullRequestNumber, this.user, name, organization);
			this.branch = branch;
		}
		setup(repository: Childprocess.GitCommands, branch: string) {
			repository.clone(repository.name, branch);
			repository.setUpstream(repository.name, repository.organization);
			repository.fetch(repository.name);
			repository.merge(repository.name);
		}
		readRepositoryConfiguration(repository: string) {
			var json = fs.readFileSync(this.pullRequestNumber +"/"+ this.primaryRepository.name +"/"+ repository+".json", "utf-8");
			var secondaryRepository: RepositoryConfiguration = JSON.parse(json);
			return secondaryRepository;
		}
		readRepositoryConfigurationTMP(repositoryName: string) : RepositoryConfiguration {
			var json = fs.readFileSync(repositoryName+".json", "utf-8");
			var secondaryRepository: RepositoryConfiguration = JSON.parse(json);
			return secondaryRepository;
		}
		manage() : ExecutionResult[]  {
			// Create folder
			if (!fs.existsSync(this.pullRequestNumber)){
			    fs.mkdirSync(this.pullRequestNumber);
			}
			// Clone, set upstream, fetch and merge primary repo
			if (!fs.existsSync(this.pullRequestNumber + '/' + this.primaryRepository.name)){
				this.setup(this.primaryRepository, this.branch);
			}
			// for testing only remove TMP!!!!!!!!!!!!
			// Read repository Configuration file in repo
			this.readRepositoryConfigurationTMP(this.primaryRepository.name);
			var secondaryRepositoryConfiguration: RepositoryConfiguration = this.readRepositoryConfigurationTMP(this.primaryRepository.name);
			this.actions = secondaryRepositoryConfiguration.actions;
			// Clone secondary repository
			if (!fs.existsSync(this.pullRequestNumber + '/' + secondaryRepositoryConfiguration.secondary)){
				this.secondaryRepository = new Childprocess.GitCommands(this.pullRequestNumber, this.user,secondaryRepositoryConfiguration.secondary ,secondaryRepositoryConfiguration.secondaryUpstream );
				this.setup(this.secondaryRepository, this.branch);
			}
			//  Perform actions
			var actionResult = this.executeActionList();
			return actionResult;
		}
		createJSON(myClass : any) {
		}
		executeActionList() : ExecutionResult[]  {
			var executionResult: ExecutionResult[] = [];
			for (var v in this.actions) {
				var action = this.actions[v];
				var result = this.executeAction(action);
				executionResult.push(new Print.ExecutionResult(action.task,result));
			}
			return executionResult;
		}
		executeAction(action: Action) : string {
			var command = 'cd ' + this.pullRequestNumber + '/' + this.primaryRepository.name + ' && ';
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
