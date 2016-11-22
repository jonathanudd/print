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
		private noTest: bool = false;
		constructor(path: string, private token: string, private branches: any, pullRequestNumber: number, user: string, private name: string, private organization: string, private upstreamBranch: string, branch: string, jobQueueHandler: JobQueueHandler, updateExecutionResults: (executionResults: ExecutionResult[]) => void) {
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
                getNoTest(): bool {return this.noTest };
                setNoTest(noTest: bool) {this.noTest = noTest; }
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
                        this.jobQueue.addJob(new Job("Git clone", "git", ["clone", "-b", this.branch, "--single-branch", userUrl], this.folderPath, false));
                        var fallbackJob = new Job("Git abort merge", "git", ["merge", "--abort"], primaryRepositoryFolderPath, true);
                        this.jobQueue.addJob(new Job("Git pull upstream", "git", ["pull", organizationUrl, this.upstreamBranch], primaryRepositoryFolderPath, false, fallbackJob));

			this.repositoryConfiguration.dependencies.forEach(repo => {
				var secondaryOrganizationUrl = githubBaseUrl + "/" + repo.organization + "/" + repo.name;
                        	var secondaryRepositoryFolderPath = this.folderPath + "/" + repo.name;
                        	var secondaryUserUrl = githubBaseUrl + "/" + this.user + "/" + repo.name;


				var thirdCloneFallbackJob = new Job("Dependency third fallback Git clone upstream", "git", ["clone", "-b", "develop", "--single-branch", secondaryOrganizationUrl],this.folderPath, true);						
                        	var secondCloneFallbackJob = new Job("Dependency second fallback Git clone upstream", "git", ["clone", "-b", this.upstreamBranch, "--single-branch", secondaryOrganizationUrl], this.folderPath, true, thirdCloneFallbackJob);
                       		var firstCloneFallbackJob = new Job("Dependency fallback Git clone upstream", "git", ["clone", "-b", this.branches[this.upstreamBranch], "--single-branch", secondaryOrganizationUrl], this.folderPath, true, secondCloneFallbackJob);
                        	this.jobQueue.addJob(new Job("Dependency first try Git clone from user", "git", ["clone", "-b", this.branch, "--single-branch", secondaryUserUrl], this.folderPath, true, firstCloneFallbackJob));

				var thirdPullFallbackJob = new Job("Dependency third fallback Git abort merge", "git", ["merge", "--abort"], secondaryRepositoryFolderPath, true);
				var secondPullFallbackJob = new Job("Dependency second fallback Git pull upstream", "git", ["pull", secondaryOrganizationUrl, "develop"],secondaryRepositoryFolderPath, true, thirdPullFallbackJob );
				var firstPullFallbackJob = new Job("Dependency fallback Git pull upstream", "git", ["pull", secondaryOrganizationUrl, this.branches[this.upstreamBranch]], secondaryRepositoryFolderPath, true, secondPullFallbackJob);
				this.jobQueue.addJob(new Job("Dependency first try Git pull dependency upstream", "git", ["pull", secondaryOrganizationUrl, this.upstreamBranch], secondaryRepositoryFolderPath, true, firstPullFallbackJob));
			});

			var createBinaryFolderJob = new Job("Create folders for archive", "mkdir", ['-p', 'binaries'],this.folderPath, true);
			this.jobQueue.addJob(createBinaryFolderJob);
                        if (this.noTest == false) {
                                this.actions.forEach(action => { this.jobQueue.addJob(Taskmaster.createJob(action, primaryRepositoryFolderPath)); });
                                //this.jobQueueHandler.addJobQueue(this.jobQueue)
                        }
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
