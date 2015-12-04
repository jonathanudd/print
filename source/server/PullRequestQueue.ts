/// <reference path="../../typings/node/node.d.ts" />
/// <reference path="../configuration/ServerConfiguration" />
/// <reference path="../github/events/PullRequestEvent" />
/// <reference path="../github/api/PullRequest" />
/// <reference path="PullRequest" />
/// <reference path="LocalServer" />
/// <reference path="../childprocess/JobQueueHandler" />

var crypt = require("crypto");

module Print.Server {
	export class PullRequestQueue {
		private path: string;
		private etag: string = "";
		private requests: PullRequest[] = [];
		private members: Github.User[];
		private teamID: string;
		private jobQueueHandler: Childprocess.JobQueueHandler;
		constructor(path: string, private name: string, private organization: string, private secret: string, private token: string, private parentOrganization: string, teamName: string, jobQueueHandler: Childprocess.JobQueueHandler) {
			this.jobQueueHandler = jobQueueHandler;
			this.path = path + "/" + this.name;
			this.createQueueFolder(this.path);
			Github.Api.PullRequest.getTeamID(parentOrganization, teamName, token, (teamID: string) => {
				this.teamID = teamID;
				Github.Api.PullRequest.getTeamMembers(this.teamID, token, (members: Github.User[]) => {
					this.members = members;
					Github.Api.PullRequest.queryOpenPullRequests(this.path, organization, name, token, this.jobQueueHandler, (requests: Server.PullRequest[], etag: string) => {
						this.etag = etag;
						this.requests = requests.filter((request) => {
							return this.verifyTeamMember(request.getUser().getUsername(), this.parentOrganization)
						});
					});
				});
			});
		}
		getName(): string { return this.name; }
		getETag(): string { return this.etag; }
		getOrganization(): string { return this.organization; }
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
					if (this.verifySender(serverSignature, buffer, this.secret)) {
						var eventData = <Github.Events.PullRequestEvent>JSON.parse(buffer);
						var pullRequest = this.find(eventData.pull_request.id);
						this.etag = header["x-github-delivery"].toString();
						if (pullRequest) {
							// TODO: Check action to see if its closed, what then?
							if (!pullRequest.tryUpdate(eventData.action, eventData.pull_request)) {
								this.requests = this.requests.filter((element) => {
									return element.getId() != eventData.pull_request.id;
								});
								console.log("Removed pull request: [" + eventData.pull_request.title + " - " + eventData.pull_request.html_url + "]");
							}
						} else {
							if(this.verifyTeamMember(eventData.pull_request.user.login, this.parentOrganization)) {
								console.log("Added pull request: [" + eventData.pull_request.title + " - " + eventData.pull_request.html_url + "]");
								this.requests.push(new PullRequest(eventData.pull_request, this.token, this.path, this.jobQueueHandler));
							}
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
		private verifyTeamMember(requestUsername: string, team: string) : boolean {
			var result = false;
			this.members.forEach(user => {
				if(user.login == requestUsername) {
					result = true;
				}
			});
			return result;
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
		createQueueFolder(queueFolder: string) {
			try {
				if (!fs.existsSync(String(queueFolder))) {
					fs.mkdirSync(String(queueFolder));
				}
			}
			catch (ex) {
				console.log(ex);
			}
		}
	}
}
