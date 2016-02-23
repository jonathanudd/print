/// <reference path="../configuration/ServerConfiguration" />
/// <reference path="../configuration/RepositoryConfiguration" />
/// <reference path="Action" />
/// <reference path="ExecutionResult" />
/// <reference path="Job" />
/// <reference path="JobQueue" />
/// <reference path="JobQueueHandler" />


var child_process = require('child_process');
var fs = require("fs");

module Print.Childprocess {
	export class Taskmaster {
		private folderPath: string;
		private pullRequestNumber: number;
		private user: string;
		private branch: string;
		private secondaryBranch: string;
		private repositoryConfiguration: RepositoryConfiguration;
		private actions: Action[] = [];
		private jobQueue: JobQueue;
		private jobQueueHandler: JobQueueHandler;
		private jobQueuesCreated: number;
		constructor(path: string, private token: string, pullRequestNumber: number, user: string, private name: string, private organization: string, branch: string, jobQueueHandler: JobQueueHandler, updateExecutionResults: (executionResults: ExecutionResult[]) => void) {
			this.pullRequestNumber = pullRequestNumber;
			this.folderPath = path + "/" + pullRequestNumber;
			this.user = user;
			this.branch = branch;
			this.jobQueuesCreated = 0;
			this.repositoryConfiguration = this.readRepositoryConfiguration(this.name);
			this.actions = this.repositoryConfiguration.actions;
			this.jobQueue = new JobQueue(this.name + " " + this.pullRequestNumber.toString(), this.jobQueuesCreated, updateExecutionResults);
			this.jobQueueHandler = jobQueueHandler;
		}
        getJobQueue() { return this.jobQueue; }
		getNrOfJobQueuesCreated() { return this.jobQueuesCreated; }
		readRepositoryConfiguration(repositoryName: string): RepositoryConfiguration {
			var json = fs.readFileSync(repositoryName + ".json", "utf-8");
			var repositoryConfiguration: RepositoryConfiguration = JSON.parse(json);
			return repositoryConfiguration;
		}
		processPullrequest() {
			this.jobQueueHandler.abortQueue(this.jobQueue);
			this.jobQueue = new JobQueue(this.jobQueue.getName(), this.jobQueuesCreated, this.jobQueue.getUpdateExecutionResultsCallback());
			this.jobQueuesCreated++;

			Taskmaster.deleteFolderRecursive(this.folderPath);
			fs.mkdirSync(this.folderPath);

			var primaryRepositoryFolderPath = this.folderPath + "/" + this.name;
			var githubBaseUrl = "https://" + this.token + "@github.com"
			var userUrl = githubBaseUrl + "/" + this.user + "/" + this.name;
			var organizationUrl = githubBaseUrl + "/" + this.organization + "/" + this.name;
			this.jobQueue.addJob(new Job("Git clone", "git", ["clone", "-b", this.branch, "--single-branch", userUrl], this.folderPath, true));
			var fallbackJob = new Job("Git abort merge", "git", ["merge", "--abort"], primaryRepositoryFolderPath, true);
			this.jobQueue.addJob(new Job("Git pull upstream", "git", ["pull", organizationUrl, "master"], primaryRepositoryFolderPath, false, fallbackJob));
			var secondaryOrganizationUrl = githubBaseUrl + "/" + this.repositoryConfiguration.secondaryUpstream + "/" + this.repositoryConfiguration.secondary;
			var secondaryRepositoryFolderPath = this.folderPath + "/" + this.repositoryConfiguration.secondary;
			var secondaryUserUrl = githubBaseUrl + "/" + this.user + "/" + this.repositoryConfiguration.secondary;
			fallbackJob = new Job("Git clone secondary upstream", "git", ["clone", "-b", "master", "--single-branch", secondaryOrganizationUrl], this.folderPath, true);
			this.jobQueue.addJob(new Job("Git clone secondary from user", "git", ["clone", "-b", this.branch, "--single-branch", secondaryUserUrl], this.folderPath, true, fallbackJob));
			fallbackJob = new Job("Git abort merge secondary", "git", ["merge", "--abort"], secondaryRepositoryFolderPath, true);
			this.jobQueue.addJob(new Job("Git pull secondary upstream", "git", ["pull", secondaryOrganizationUrl, "master"], secondaryRepositoryFolderPath, false, fallbackJob));

			this.actions.forEach(action => { this.jobQueue.addJob(Taskmaster.createJob(action, primaryRepositoryFolderPath)); });
			this.jobQueueHandler.addJobQueue(this.jobQueue)
		}
        private static createJob(action: Action, repositoryPath: string) {
            var args: string[] = [];
            var path: string = repositoryPath;
            if (action.args)
                args = action.args.replace("~", process.env["HOME"]).split(",");
            if (action.path)
                path += "/" + action.path;
            var fallback: Job;
            if (action.fallback)
                fallback = Taskmaster.createJob(action.fallback, repositoryPath);
            return new Job(action.name, action.command, args, path, (action.hide == "true"), fallback);
        }
		static deleteFolderRecursive(path: string) {
  			if( fs.existsSync(path) ) {
    			fs.readdirSync(path).forEach(function(file: string) {
      				var curPath = path + "/" + file;
      				if(fs.lstatSync(curPath).isDirectory()) { // recurse
        				Taskmaster.deleteFolderRecursive(curPath);
      				} else { // delete file
        				fs.unlinkSync(curPath);
      				}
    			});
    			fs.rmdirSync(path);
  			}
		}
	}
}
