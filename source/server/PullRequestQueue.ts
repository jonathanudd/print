/// <reference path="../../typings/node/node.d.ts" />
/// <reference path="../configuration/ServerConfiguration" />
/// <reference path="../github/events/PullRequestEvent" />
/// <reference path="../github/api/PullRequest" />
/// <reference path="PullRequest" />
/// <reference path="LocalServer" />

var crypt = require("crypto");

module Print.Server {
	export class PullRequestQueue {
		private requests: PullRequest[] = [];
		constructor(private name: string, private organization: string, private token: string) {
			Github.Api.PullRequest.queryOpenPullRequests(organization, name, (requests: Server.PullRequest[]) => {
				this.requests = requests;
			});
		}
		getName(): string { return this.name; }
		process(name: string, request: any, response: any): boolean {
			var result: boolean;
			var buffer: string = "";
			if (result = (name == this.name)) {
				request.on("data", (chunk: any) => {
					buffer += chunk;
				});
				request.on("end", () => {
					var header = JSON.parse(JSON.stringify(request.headers));
					var serverSignature: string = header["x-hub-signature"].toString()
					if (this.verifySender(serverSignature, buffer, this.token)) {
						var eventData = <Github.Events.PullRequestEvent>JSON.parse(buffer);
						var pullRequest = this.find(eventData.pull_request.id);
						if (pullRequest) {
							pullRequest.tryUpdate(eventData.pull_request);
						} else {
							console.log("Added pull request: [" + pullRequest.getTitle() + " - " + pullRequest.getUrl() + "]");
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
				jsonObject.push(request.toJSON())
			});
			return JSON.stringify(jsonObject);
		}
		private verifySender(serverSignature: string, payload: string, token: string): boolean {
			// TODO: secure compare?
			return  "sha1=" + crypt.createHmac("sha1", token).update(payload).digest("hex") == serverSignature;
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
