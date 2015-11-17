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
			//constructor(pullRequestNumber: string, user: string,name: string, organization: string, branch: string) {
			this.readPullRequestData(request);
			this.taskmaster = new Print.Childprocess.Taskmaster(this.number, request.user, request. );
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
			console.log("attempting to update pull request")
			if (request.created_at != request.updated_at) {
				this.readPullRequestData(request);
				console.log("pull request updated")
				result = true;
			}
			return result;
		}
		private readPullRequestData(pullRequest: Github.PullRequest) {
			this.id = pullRequest.id;
			this.title = pullRequest.title;
			this.description = pullRequest.body;
			this.createdAt = pullRequest.created_at;
			this.updatedAt = pullRequest.updated_at;
			this.commitCount = pullRequest.commits;
			this.url = pullRequest.html_url;
			this.diffUrl = pullRequest.diff_url;
		}
		process() {
			//console.log("processing pull request");
			//this.taskmaster.manage();
		}
	}
}
