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
		private postToGithub: boolean;
		constructor(path: string, private name: string, private organization: string, private secret: string, private token: string, private parentOrganization: string, teamName: string, jobQueueHandler: Childprocess.JobQueueHandler, statusTargetUrl: string, postToGithub: boolean) {
			this.jobQueueHandler = jobQueueHandler;
			this.path = path + "/" + this.name;
			this.postToGithub = postToGithub;
			this.createQueueFolder(this.path);
			this.setNewEtag();
			Github.Api.PullRequest.getTeamID(parentOrganization, teamName, token, (teamID: string) => {
				this.teamID = teamID;
				Github.Api.PullRequest.getTeamMembers(this.teamID, token, (members: Github.User[]) => {
					this.members = members;
					Github.Api.PullRequest.queryOpenPullRequests(this.path, organization, name, token, this.jobQueueHandler, this, statusTargetUrl, this.postToGithub, (requests: Server.PullRequest[]) => {
						this.setNewEtag();
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
		process(name: string, request: any, response: any, statusTargetUrl: string): boolean {
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
						if (["opened", "closed", "reopened", "synchronize"].indexOf(eventData.action) >= 0) {
							var pullRequest = this.find(eventData.pull_request.id);
							this.setNewEtag();
							if (pullRequest) {
								if (!pullRequest.tryUpdate(eventData.action, eventData.pull_request)) {
									this.requests = this.requests.filter((element) => {
										return element.getId() != eventData.pull_request.id;
									});
									console.log("Removed pull request: [" + eventData.pull_request.title + " - " + eventData.pull_request.html_url + "]");
								}
							}
							else {
								if(this.verifyTeamMember(eventData.pull_request.user.login, this.parentOrganization)) {
									console.log("Added pull request: [" + eventData.pull_request.title + " - " + eventData.pull_request.html_url + "]");
									this.requests.push(new PullRequest(eventData.pull_request, this.token, this.path, this.jobQueueHandler, this, statusTargetUrl, this.postToGithub));
								}
							}
						}
						LocalServer.sendResponse(response, 200, "OK");
					}
					else {
						console.log("Unauthorized sender");
						console.log("Header: ");
						console.log(header);
						console.log("Payload: ");
						console.log(buffer);
						LocalServer.sendResponse(response, 404, "Not found");
					}
				}).on("error", (error: any) => {
					console.log("Failed when processing pullrequest with error: " + error);
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
		setNewEtag() {
			this.etag = crypt.randomBytes(20).toString("hex");
		}
	}
}
