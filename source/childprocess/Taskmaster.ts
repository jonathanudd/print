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
		constructor(path: string, private token: string, pullRequestNumber: number, user: string, private name: string, private organization: string, branch: string, jobQueueHandler: JobQueueHandler, allJobsFinishedCallback: (executionResults: ExecutionResult[]) => void) {
			this.pullRequestNumber = pullRequestNumber;
			this.folderPath = path + "/" + pullRequestNumber;
			this.user = user;
			this.branch = branch;
			this.repositoryConfiguration = this.readRepositoryConfiguration(this.name);
			this.actions = this.repositoryConfiguration.actions;
			this.jobQueue = new JobQueue(this.name + " " + this.pullRequestNumber.toString(), allJobsFinishedCallback);
			this.jobQueueHandler = jobQueueHandler;
		}
		readRepositoryConfiguration(repositoryName: string): RepositoryConfiguration {
			var json = fs.readFileSync(repositoryName + ".json", "utf-8");
			var repositoryConfiguration: RepositoryConfiguration = JSON.parse(json);
			return repositoryConfiguration;
		}
		processPullrequest() {
			this.jobQueueHandler.abortQueue(this.jobQueue);			
			this.jobQueue = new JobQueue(this.jobQueue.getName(), this.jobQueue.getAllJobsFinishedCallback());			
			
			Taskmaster.deleteFolderRecursive(this.folderPath);
			fs.mkdirSync(this.folderPath);
			
			var primaryRepositoryFolderPath = this.folderPath + "/" + this.name;
			var githubBaseUrl = "https://" + this.token + "@github.com"
			var userUrl = githubBaseUrl + "/" + this.user + "/" + this.name;
			var organizationUrl = githubBaseUrl + "/" + this.organization + "/" + this.name;
			this.jobQueue.addJob(new Job("Git clone", "git", ["clone", "-b", this.branch, "--single-branch", userUrl], this.folderPath));
			this.jobQueue.addJob(new Job("Git pull upstream", "git", ["pull", organizationUrl, "master"], primaryRepositoryFolderPath));
			this.jobQueue.addJob(new Job("Git reset to first HEAD", "git", ["reset", "--hard", "HEAD~0"], primaryRepositoryFolderPath));
			var secondaryOrganizationUrl = githubBaseUrl + "/" + this.repositoryConfiguration.secondaryUpstream + "/" + this.repositoryConfiguration.secondary;
			var secondaryRepositoryFolderPath = this.folderPath + "/" + this.repositoryConfiguration.secondary;
			this.jobQueue.addJob(new Job("Git clone secondary upstream", "git", ["clone", "-b", "master", "--single-branch", secondaryOrganizationUrl], this.folderPath));
			
			this.actions.forEach(action => {
				var args: string[] = [];
				var path: string = primaryRepositoryFolderPath;
				if (action.args)
					args = action.args.split(",");
				if (action.path)
					path += "/" + action.path;
				if (action.dependency != "none")
					args.push(process.env["HOME"] + "/Video/" + action.dependency);
				this.jobQueue.addJob(new Job(action.task, action.task, args, path));
			});
			
			this.jobQueueHandler.addJobQueue(this.jobQueue)
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
