/// <reference path="../../typings/node/node.d.ts" />
/// <reference path="../configuration/ServerConfiguration" />
/// <reference path="../github/events/PullRequestEvent" />
/// <reference path="../childprocess/Taskmaster" />
/// <reference path="../childprocess/ExecutionResult" />


module Print.Server {
	export class PullRequest {
		private id: string;
		private number: number;
		private title: string;
		private description: string;
		private createdAt: string;
		private updatedAt: string;
		private statusesUrl: string;
		private commitCount: number;
		private url: string;
		private diffUrl: string;
		private repositoryName: string;
		private taskmaster: Print.Childprocess.Taskmaster;
		private executionResults: Childprocess.ExecutionResult[] = [];
		constructor(request: Github.PullRequest) {
			this.readPullRequestData(request);
			var user = request.user.login;
			var organization = request.base.user.login;
			var branch = request.head.ref;
			this.repositoryName = request.head.repo.name;
			this.taskmaster = new Print.Childprocess.Taskmaster(this.number, user, this.repositoryName, organization, branch);
		}
		getId(): string { return this.id; }
		getNumber(): number { return this.number; }
		getTitle(): string { return this.title; }
		getCreatedAt(): Date { return new Date(this.createdAt); }
		getUpdatedAt(): Date { return new Date(this.createdAt); }
		getCommitCount(): number { return this.commitCount; }
		getUrl(): string { return this.url; }
		getDiffUrl(): string { return this.diffUrl; }
		getRepositoryName(): string { return this.repositoryName; }
		tryUpdate(action: string, request: Github.PullRequest): boolean {
			var result = false;
			if (action == "closed") {
				console.log("Closed pull request: [" + request.title + " - " + request.html_url + "]");
			} else {
				if (request.created_at != request.updated_at) {
					this.readPullRequestData(request);
					console.log("Updated pull request: [" + request.title + " - " + request.html_url + "]")
					result = true;
					this.processPullRequest();
				}
			}
			return result;
		}
		processPullRequest() {
			this.executionResults = this.taskmaster.manage();
			console.log(this.toJSON());
		}
		toJSON(): string {
			var executionResultJSON: any[] = [];
			this.executionResults.forEach(result => {
				executionResultJSON.push(JSON.parse(result.toJSON()));
			});
			return JSON.stringify({
				"id": this.id,
				"number": this.number,
				"title": this.title,
				"description": this.description,
				"createdAt": this.createdAt,
				"updatedAt": this.updatedAt,
				"statusesUrl": this.statusesUrl,
				"commitCount": this.commitCount,
				"url": this.url,
				"repositoryName": this.repositoryName,
				"executionResults": executionResultJSON
			});
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
	}
}
