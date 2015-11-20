/// <reference path="../../typings/node/node.d.ts" />
/// <reference path="../configuration/ServerConfiguration" />
/// <reference path="../github/events/PullRequestEvent" />
/// <reference path="../github/api/PullRequest" />
/// <reference path="PullRequest" />
/// <reference path="LocalServer" />

var crypt = require("crypto");

module Print.Server {
	export class PullRequestQueue {
		private etag: string = "";
		private requests: PullRequest[] = [];
		constructor(private name: string, private organization: string, private token: string) {
			Github.Api.PullRequest.queryOpenPullRequests(organization, name, (requests: Server.PullRequest[], etag: string) => {
				this.etag = etag;
				this.requests = requests;
			});
		}
		getName(): string { return this.name; }
		getETag(): string { return this.etag; }
		process(name: string, request: any, response: any): boolean {
			var result: boolean;
			var buffer: string = "";
			if (result = (name == this.name)) {
				request.on("data", (chunk: any) => {
					buffer += chunk;
				});
				request.on("end", () => {
					var header = JSON.parse(JSON.stringify(request.headers));
					var serverSignature: string = header["x-hub-signature"].toString();
					if (this.verifySender(serverSignature, buffer, this.token)) {
						var eventData = <Github.Events.PullRequestEvent>JSON.parse(buffer);
						var pullRequest = this.find(eventData.pull_request.id);
						this.etag = header["x-github-delivery"].toString();
						if (pullRequest) {
							// TODO: Check action to see if its closed, what then?
							pullRequest.tryUpdate(eventData.action, eventData.pull_request);
						} else {
							console.log("Added pull request: [" + eventData.pull_request.title + " - " + eventData.pull_request.html_url + "]");
							this.requests.push(new PullRequest(eventData.pull_request));
						}
						LocalServer.sendResponse(response, 200, "OK");
					} else {
						console.log("Unauthorized sender");
						LocalServer.sendResponse(response, 404, "Not found");
					}
				});
			}
			return result;
		}
		toJSON(): string {
			var jsonObject: any[] = [];
			this.requests.forEach(request => {
				jsonObject.push(JSON.parse(request.toJSON()));
			});
			return JSON.stringify(jsonObject);
		}
		private verifySender(serverSignature: string, payload: string, token: string): boolean {
			return "sha1=" + crypt.createHmac("sha1", token).update(payload).digest("hex") == serverSignature;
		}
		find(pullRequestId: string): PullRequest {
			var result: PullRequest;
			this.requests.some(request => {
				if (request.getId() == pullRequestId) {
					result = request;
					return true;
				}
				return false;
			});
			return result;
		}
	}
}
