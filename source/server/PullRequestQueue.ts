/// <reference path="../../typings/node/node.d.ts" />
/// <reference path="../configuration/ServerConfiguration" />
/// <reference path="../github/events/PullRequestEvent" />
/// <reference path="../github/api/PullRequest" />
/// <reference path="PullRequest" />
/// <reference path="../childprocess/JobQueueHandler" />
/// <reference path="../github/Label" />
/// <reference path="IncommingConnection" />

var crypt = require("crypto");

module Print.Server {
	export class PullRequestQueue {
		private path: string;
		private etag: string = "";
		private requests: PullRequest[] = [];
		private members: Github.User[];
		constructor(path: string, private name: string, private organization: string, private secret: string, private jobQueueHandler: Childprocess.JobQueueHandler, statusTargetUrl: string) {
			var serverConfig = ServerConfiguration.getServerConfig();
			this.path = path + "/" + this.name;
			this.createQueueFolder(this.path);
			this.setNewEtag();
			Github.Api.PullRequest.getTeamMembers((members: Github.User[]) => {
				this.members = members;
				Github.Api.PullRequest.queryOpenPullRequests(organization, name, (requests: Github.PullRequest[]) => {
					this.setNewEtag();
					requests.forEach(request => {
						if (this.verifyTeamMember(request.user.login)) {
							var pr = new PullRequest(request, serverConfig.getAuthorizationToken(), this.path, this.jobQueueHandler, this, statusTargetUrl);
							var labelsBuffer: string = ""
							var options = {
								hostname: "api.github.com",
								path: "/repos/" + organization + "/" + name + "/issues/" + request.number.toString() + "/labels",
								method: "GET",
								headers: { "User-Agent": "print", "Authorization": "token " + serverConfig.getAuthorizationToken() }
							}; 
							https.request(options, (labelsResponse: any) => {
								labelsResponse.on("data", (chunk: string) => {
									labelsBuffer += chunk;
								});
								labelsResponse.on("error", (error: any) => {
									console.log("Error when fetching labels: ", error.toString()) ;
								});
								labelsResponse.on("end", () => {
									var labels: Label[] = []; 
									(<Github.Label[]>JSON.parse(labelsBuffer)).forEach(label => {
										labels.push(new Label(label));
									});
									pr.setLabels(labels);
								});
							}).end();
							this.requests.push(pr);
						} else
							console.log("Failed to add pull request: [" + request.title + " - " + request.html_url + "]. The user could not be verified: [" + request.user.login + "]");
					})
				});
			});
		}
		getName(): string { return this.name; }
		getETag(): string { return this.etag; }
		getOrganization(): string { return this.organization; }
		process(name: string, request: any, resp: IncommingConnection, statusTargetUrl: string): boolean {
			var serverConfig = ServerConfiguration.getServerConfig();
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
								if(this.verifyTeamMember(eventData.pull_request.user.login)) {
									console.log("Added pull request: [" + eventData.pull_request.title + " - " + eventData.pull_request.html_url + "]");
									var pr = new PullRequest(eventData.pull_request, serverConfig.getAuthorizationToken(), this.path, this.jobQueueHandler, this, statusTargetUrl);
									var labelsBuffer: string = ""
									var options = {
										hostname: "api.github.com",
										path: "/repos/" + this.organization + "/" + name + "/issues/" + pr.getNumber().toString() + "/labels",
										method: "GET",
										headers: { "User-Agent": "print", "Authorization": "token " + serverConfig.getAuthorizationToken() }
									}; 
									https.request(options, (labelsResponse: any) => {
										labelsResponse.on("data", (chunk: string) => {
											labelsBuffer += chunk;
										});
										labelsResponse.on("error", (error: any) => {
											console.log("Error when fetching labels: ", error.toString()) ;
										});
										labelsResponse.on("end", () => {
											var labels: Label[] = []; 
											(<Github.Label[]>JSON.parse(labelsBuffer)).forEach(label => {
												labels.push(new Label(label));
											});
											pr.setLabels(labels);
										});
									}).end();
									this.requests.push(pr);
								} else
									console.log("Failed to add pull request: [" + eventData.pull_request.title + " - " + eventData.pull_request.html_url + "]. The user could not be verified: [" + eventData.pull_request.user.login + "]");
							}
						}
						else if (["labeled", "unlabeled"].indexOf(eventData.action) >= 0) {
							var pullRequest = this.find(eventData.pull_request.id);
							this.setNewEtag();
							if (pullRequest) {
								var labelsBuffer: string = ""
								var options = {
									hostname: "api.github.com",
									path: "/repos/" + this.organization + "/" + name + "/issues/" + pullRequest.getNumber().toString() + "/labels",
									method: "GET",
									headers: { "User-Agent": "print", "Authorization": "token " + serverConfig.getAuthorizationToken() }
								}; 
								https.request(options, (labelsResponse: any) => {
									labelsResponse.on("data", (chunk: string) => {
										labelsBuffer += chunk;
									});
									labelsResponse.on("error", (error: any) => {
										console.log("Error when fetching labels: ", error.toString()) ;
									});
									labelsResponse.on("end", () => {
										var labels: Label[] = []; 
										(<Github.Label[]>JSON.parse(labelsBuffer)).forEach(label => {
											labels.push(new Label(label));
										});
										pullRequest.setLabels(labels);
									});
								}).end();
							}
						}
						resp.write("", 200);
					}
					else {
						console.log("Unauthorized sender");
						console.log("Header: ");
						console.log(header);
						console.log("Payload: ");
						console.log(buffer);
						resp.write("", 404);
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
		private verifyTeamMember(requestUsername: string) : boolean {
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
