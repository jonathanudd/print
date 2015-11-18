/// <reference path="../../typings/node/node.d.ts" />
/// <reference path="../configuration/ServerConfiguration" />
/// <reference path="../github/events/PullRequestEvent" />
/// <reference path="../childprocess/Taskmaster" />

module Print.Server {
	export class PullRequest {
		private id: string;
		private number: number;
		private title: string;
		private description: string;
		private createdAt: string;
		private updatedAt: string;
		private commitCount: number;
		private url: string;
		private diffUrl: string;
		private taskmaster: Print.Childprocess.Taskmaster
		constructor(request: Github.PullRequest) {
			this.readPullRequestData(request);
			var user = request.user.login;
			var repositoryName = request.head.repo.name;
			var organization = request.base.user.login;
			var branch = request.head.ref;
			this.taskmaster = new Print.Childprocess.Taskmaster(this.number, user, repositoryName, organization, branch);
			this.processPullRequest();
		}
		getId(): string { return this.id; }
		getNumber(): number { return this.number; }
		getTitle(): string { return this.title; }
		getCreatedAt(): Date { return new Date(this.createdAt); }
		getUpdatedAt(): Date { return new Date(this.createdAt); }
		getCommitCount(): number { return this.commitCount; }
		getUrl(): string { return this.url; }
		getDiffUrl(): string { return this.diffUrl; }
		tryUpdate(request: Github.PullRequest): boolean {
			var result = false;
			if (request.created_at != request.updated_at) {
				this.readPullRequestData(request);
				console.log("Updated pull request: [" + request.title + " - " + request.html_url + "]")
				result = true;
				this.processPullRequest();
			}
			return result;
		}
		private readPullRequestData(pullRequest: Github.PullRequest) {
			this.id = pullRequest.id;
			this.number = pullRequest.number;
			this.title = pullRequest.title;
			this.description = pullRequest.body;
			this.createdAt = pullRequest.created_at;
			this.updatedAt = pullRequest.updated_at;
			this.commitCount = pullRequest.commits;
			this.url = pullRequest.html_url;
			this.diffUrl = pullRequest.diff_url;
		}
		processPullRequest() {
			console.log("processing pull request");
			this.taskmaster.manage();
		}
	}
}
