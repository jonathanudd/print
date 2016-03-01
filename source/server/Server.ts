/// <reference path="../../typings/node/node.d.ts" />
/// <reference path="../configuration/ServerConfiguration" />
/// <reference path="PullRequestQueue" />
/// <reference path="../github/AccessToken" />
/// <reference path="../childprocess/JobQueueHandler" />
/// <reference path="IncommingConnection" />

var http = require("http");
var urlparser = require("url");
var querystring = require("querystring");
var fs = require("fs");
var crypt = require("crypto");
var child_process = require("child_process");

module Print.Server {
	export class Server {
		private server: any;
		private pullRequestQueues: PullRequestQueue[] = [];
		private accessTokens: string[] = [];
		private printApiRoot: string = "print";
		private clientRoot: string = "print/print-client";
		private githubScopes: string = "repo,public_repo";
		private baseUrl: string = "";
		private jobQueueHandler: Childprocess.JobQueueHandler;
		private serverConfig: ServerConfiguration;
		constructor(buildFolder: string) {
			this.serverConfig = ServerConfiguration.getServerConfig();
			this.jobQueueHandler = new Childprocess.JobQueueHandler();
			this.baseUrl = this.serverConfig.getBaseUrl() + ":" + this.serverConfig.getServerPort().toString();
			ServerConfiguration.getServerConfig().getRepos().forEach(repo => {
				this.pullRequestQueues.push(new PullRequestQueue(buildFolder, repo.name, repo.organization, repo.secret, this.jobQueueHandler, this.baseUrl + "/" + this.clientRoot));
			});
			this.server = http.createServer((request: any, response: any) => {
				try { this.requestCallback(request, response) }
				catch (error) { console.log("Failed in request callback on server with error: " + error); }
			});
		}
		start() {
			this.server.listen(this.serverConfig.getServerPort(), () => {
				console.log("listening on port " + this.serverConfig.getServerPort());
			});
		}
		stop() {
			this.server.close(() => {
				console.log("server closed");
			});
		}
		private requestCallback(request: any, response: any) {
			var inCon = new IncommingConnection(response);
			var url = urlparser.parse(request.url.toLowerCase(), true);			
			var name = url.href.substr(7, url.href.length - 7);
			var header = JSON.parse(JSON.stringify(request.headers));
			switch (<string>request.method) {
				case "POST":
					if (!this.pullRequestQueues.some(queue => { return queue.process(name, request, inCon, this.baseUrl + "/" + this.clientRoot); }))
						inCon.write("", 404);
					break;
				case "GET":
					var urlPathList: string[] = url.pathname.split("/");
					var cookieValue: string = Server.getCookieValue(request.headers.cookie, "authorized");
					var accessToken: string = this.findAccessToken(Server.getCookieValue(request.headers.cookie, "authorized"));
					if (url.query.error) {
						console.log("Github ERROR: [" + url.query.error + "] Description: [" + url.query.error_description + "] Uri: [" + url.query.error_uri + "]");
						inCon.write("Github error. See error message in serverlog.", 400);
					}
					else if (url.query.authorized == "no") {
						this.fetchAccessToken(inCon, url);
					}
					else if (!accessToken) {
						if (url.pathname == "/")
							var redirectUrl = this.baseUrl + "/" + this.clientRoot
						else
							var redirectUrl = this.baseUrl + url.pathname
						inCon.write("", 301, { "Location": "https://github.com/login/oauth/authorize?scope=" + this.githubScopes + "&client_id=" + this.serverConfig.getClientId() + "&redirect_uri=" + redirectUrl + "?authorized=no"});
					}
					else if (urlPathList[1] + "/" + urlPathList[2] == this.clientRoot) {
							if (urlPathList[3] == "check-privileges") {
								var isAdmin = "no";
                                var options = {
                                    hostname: "api.github.com",
                                    path: "/user",
                                    headers: { "User-Agent": "print", "Authorization" : "token " + accessToken }
                                };
                                var buffer: string = "";
                                https.get(options, (authResponse: any) => {
                                    authResponse.on("data", (data: string) => {
                                        buffer += data;
                                    });
                                    authResponse.on("error", (error: any) => {
                                       console.log("Error when checking if admin: " + error.toString()) 
                                    });
                                    authResponse.on("end", () => {
                                        var user = <Github.User>JSON.parse(buffer);
                                        if (user.login == this.serverConfig.getAdmin())
                                            isAdmin = "yes";
										inCon.write('{ "admin": "' + isAdmin + '" }', 200, { "Content-Type": "application/json" });
                                    });
                                });
							}
							else if (url.pathname.split(".").length > 1)
								inCon.writeFile(url.pathname.substr(7));
							else
								inCon.writeFile("print-client/index.html");
					}
					else if (urlPathList[1] == this.printApiRoot) {
						if (urlPathList[3] == "pr") {
							var repo = urlPathList[2];
							this.pullRequestQueues.forEach(queue => {
								if (queue.getName() == repo) {
									var options = {
										hostname: "api.github.com",
										path: "/repos/" + queue.getOrganization() + "/" + repo,
										headers: { "User-Agent": "print", "Authorization" : "token " + accessToken }
									};
									https.get(options, (authResponse: any) => {
										if (authResponse.statusCode == 200) {
											var pr = queue.find(urlPathList[4]);
											if (pr) {
												var etag: string = header["etag"];
												if (etag != pr.getEtag())
													inCon.write(pr.toJSON(), 200, { "etag": pr.getEtag(), "Content-Type": "application/json" });
												else
													inCon.write("", 304, { "etag": etag });
											}
										}
										else
											inCon.write('{ "error": "You are not authorized to view this repository" }', 400, { "Content-Type": "application/json" });
									}).on("error", (error: any) => {
										console.log("Failed when users read right on repo with error: " + error);
									});
								}
							});
						}
						else if (urlPathList[2] == "repolist") {
							var repos: string[] = [];
							this.pullRequestQueues.forEach(queue => {
								repos.push(queue.getName());
							});
							inCon.write(JSON.stringify(repos), 200, { "Content-Type": "application/json" });
						}
						else if (urlPathList[2] == "explore") {
							var options = {
								hostname: "api.github.com",
								path: "/user",
								headers: { "User-Agent": "print", "Authorization" : "token " + accessToken }
							};
							var buffer: string = "";
							https.get(options, (authResponse: any) => {
								authResponse.on("data", (data: string) => {
									buffer += data;
								});
								authResponse.on("error", (error: any) => {
									console.log("Error when checking if admin: " + error.toString()) 
								});
								authResponse.on("end", () => {
									var user = <Github.User>JSON.parse(buffer);
									if (user.login == this.serverConfig.getAdmin() || urlPathList[3] == "runtests") {
										var pr: any;
										this.pullRequestQueues.forEach(queue => {
											if (queue.getName() == urlPathList[4]) {
												pr = queue.find(urlPathList[5]);
											}
										});
										var path = process.env['HOME'] + "/repositories/" + urlPathList[4] + "/" + pr.getNumber().toString();
										if (urlPathList[3] == "terminal") {
											child_process.spawn("gnome-terminal", [], { cwd: path }).on("error", (error: any) => {
												console.log("Failed to spawn gnome-terminal. " + error)
											});
											inCon.write("", 200);
										}
										else if(urlPathList[3] == "nautilus") {
											child_process.spawn("nautilus", ["--browser", path]).on("error", (error: any) => {
												console.log("Failed to spawn gnome-terminal. " + error)
											});
											inCon.write("", 200);
										}
										else if(urlPathList[3] == "android") {
											child_process.exec("tools/android/flash_vidhance.sh", { cwd: (path + "/ooc-vidproc") }, console.log).on("error", (error: any) => {
												console.log("Failed to spawn flash_vidhance.sh." + error)
											});
											inCon.write("", 200);
										}
										else if(urlPathList[3] == "runtests") {
											pr.processPullRequest()
											inCon.write("", 200);
										}
										else if(urlPathList[3] == "download-binaries")
											inCon.writeFile(path + "/binaries.tar.gz", true);
									} else
										inCon.write("", 400);
								});
							});
						}
						else if (urlPathList[2]) {
							var repo = urlPathList[2];
							this.pullRequestQueues.forEach(queue => {
								if (queue.getName() == repo) {
									var options = {
										hostname: "api.github.com",
										path: "/repos/" + queue.getOrganization() + "/" + repo,
										headers: { "User-Agent": "print", "Authorization" : "token " + accessToken }
									};
									https.get(options, (authResponse: any) => {
										if (authResponse.statusCode == 200) {
											var etag: string = header["etag"];
											if (etag != queue.getETag())
												inCon.write(queue.toJSON(), 200, { "etag": queue.getETag(), "Content-Type": "application/json" });
											else
												inCon.write("", 304, { "etag": etag });
										}
										else
											inCon.write('{ "error": "You are not authorized to view this repository" }', 400, { "Content-Type": "application/json" });
									}).on("error", (error: any) => {
										console.log("Failed when users read right on repo with error: " + error);
									});
								}
							});
						}
						else
							inCon.write("", 400);
					}
					else
						inCon.write("", 400);
					break;
				default:
					inCon.write("", 400);
					break;
			}
		}
		private fetchAccessToken(inCon: IncommingConnection, url: any) {
			var post_data = querystring.stringify({
				"client_id": this.serverConfig.getClientId(),
				"client_secret": this.serverConfig.getClientSecret(),
				"code": url.query.code
			});
			var post_options = {
				host: "github.com",
				path: "/login/oauth/access_token",
				method: "POST",
				headers: {
					"Content-Length": Buffer.byteLength(post_data),
					"Accept": "application/json"
				}
			};
			var post_request = https.request(post_options, (response: any) => {
				var buffer: string = "";
				response.on("data", (data: any) => {
					buffer += data;
				});
				response.on("end", () => {
					var accessToken = <Github.AccessToken>JSON.parse(buffer);
					if (accessToken.error) {
						console.log("Github ERROR: [" + accessToken.error + "] Description: [" + accessToken.error_description + "] Uri: [" + accessToken.error_uri + "]");
						inCon.write("Github error. See error message in server log", 400);
					}
					else {
						this.accessTokens.push(accessToken.access_token);
						var hash = crypt.createHmac("sha1", this.serverConfig.getCookieSecret()).update(accessToken.access_token).digest("hex");
						inCon.write("", 301, { "Location": url.pathname + "?authorized=yes", "Set-Cookie": "authorized=" + hash + "; path=/" });
					}
				});
			}).on("error", (error: any) => {
				console.log("Failed when fetching users access token with error: " + error);
			});
			post_request.write(post_data);
			post_request.end();
		}
		static getCookieValue(cookies: string, name: string) {
			if (cookies) {
				var cookieList = cookies.replace(/ /g, "").split(";");
				for (var i = 0; i < cookies.length; i++) {
					if (cookieList[i]) {
						var cookie = cookieList[i].split("=")
						if(name == cookie[0]) {
							return cookie[1];
						}
					}
				}
			}
			return "";
		}
		findAccessToken(cookieValue: string) {
			for (var i = 0; i < this.accessTokens.length; i++) {
				if (cookieValue == crypt.createHmac("sha1", this.serverConfig.getCookieSecret()).update(this.accessTokens[i]).digest("hex")) {
					return this.accessTokens[i];
				}
			}
			return "";
		}
	}
}
