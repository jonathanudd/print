/// <reference path="../../typings/node/node.d.ts" />
/// <reference path="../configuration/ServerConfiguration" />
/// <reference path="../github/events/PullRequestEvent" />
/// <reference path="../childprocess/Taskmaster" />
/// <reference path="../childprocess/ExecutionResult" />
/// <reference path="../childprocess/JobQueueHandler" />
/// <reference path="../github/api/PullRequest" />
/// <reference path="User" />
/// <reference path="Fork" />
/// <reference path="PullRequestQueue" />

var crypt = require("crypto");

module Print.Server {
	export class PullRequest {
		private etag: string;
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
		private user: User;
		private head: Fork;
		private base: Fork;
		private taskmaster: Print.Childprocess.Taskmaster;
		private executionResults: Childprocess.ExecutionResult[] = [];
		private parentQueue: PullRequestQueue;
		constructor(request: Github.PullRequest, private token: string, path: string, jobQueueHandler: Childprocess.JobQueueHandler, parentQueue: PullRequestQueue) {
			this.parentQueue = parentQueue;
			this.readPullRequestData(request);
			var user = request.user.login;
			var organization = request.base.user.login;
			var branch = request.head.ref;
			this.repositoryName = request.head.repo.name;
			this.setNewEtag();
			parentQueue.setNewEtag();
			this.taskmaster = new Print.Childprocess.Taskmaster(path, token, this.number, user, this.repositoryName, organization, branch, jobQueueHandler, this.updateExecutionResults.bind(this));
			
			this.processPullRequest();
		}
		getEtag(): string { return this.etag }
		getId(): string { return this.id; }
		getNumber(): number { return this.number; }
		getTitle(): string { return this.title; }
		getCreatedAt(): Date { return new Date(this.createdAt); }
		getUpdatedAt(): Date { return new Date(this.createdAt); }
		getCommitCount(): number { return this.commitCount; }
		getUrl(): string { return this.url; }
		getDiffUrl(): string { return this.diffUrl; }
		getRepositoryName(): string { return this.repositoryName; }
		getUser(): User { return this.user; }
		tryUpdate(action: string, request: Github.PullRequest): boolean {
			var result = false;
			if (action == "closed") {
				console.log("Closed pull request: [" + request.title + " - " + request.html_url + "]");
			} else {
				if (request.created_at != request.updated_at) {
					this.setNewEtag();
					this.readPullRequestData(request);
					console.log("Updated pull request: [" + request.title + " - " + request.html_url + "]")
					result = true;
					this.processPullRequest();
				}
			}
			return result;
		}
		processPullRequest() {
			try {
				this.taskmaster.processPullrequest();
			}
			catch (error) {
				console.log("Failed when processing pullrequest for " + this.number + " " + this.title);
			} 			
		}
		updateExecutionResults(executionResults: Childprocess.ExecutionResult[]) {
			this.executionResults = executionResults;
			this.setNewEtag();
			this.parentQueue.setNewEtag();
			var status = this.extractStatus(this.executionResults);
			if(status) {
				Github.Api.PullRequest.updateStatus("success", "The build succeeded! You are great!", this.statusesUrl, this.token);
			}
			else {
				Github.Api.PullRequest.updateStatus("failure", "The build failed! This is not good!", this.statusesUrl, this.token);
				
			}
		}
		extractStatus(results: Childprocess.ExecutionResult[]): boolean {
			var status: boolean = true;
			for (var i = 0; i < results.length; i++) {
				if (results[i].getResult() != "0") {
					status = false;
					i = results.length;
				}
			}
			return status;
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
				"executionResults": executionResultJSON,
				"user": JSON.parse(this.user.toJSON()),
				"head": JSON.parse(this.head.toJSON()),
				"base": JSON.parse(this.base.toJSON())
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
			this.statusesUrl = pullRequest.statuses_url;
			this.user = new User(pullRequest.user);
			this.head = new Fork(pullRequest.head);
			this.base = new Fork(pullRequest.base);
		}
		setNewEtag() {
			this.etag = crypt.randomBytes(20).toString("hex");
		}
	}
}
