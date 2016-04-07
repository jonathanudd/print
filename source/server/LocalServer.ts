/// <reference path="../../typings/node/node.d.ts" />
/// <reference path="../configuration/ServerConfiguration" />
/// <reference path="PullRequestQueue" />
/// <reference path="../github/AccessToken" />
/// <reference path="../childprocess/JobQueueHandler" />

var http = require("http");
var urlparser = require("url");
var querystring = require("querystring");
var fs = require("fs");
var crypt = require("crypto");
var child_process = require("child_process");

module Print.Server {
	export class LocalServer {
		private server: any;
		private pullRequestQueues: PullRequestQueue[] = [];
		private accessTokens: string[] = [];
		private printApiRoot: string = "print";
		private clientRoot: string = "print/print-client";
		private githubScopes: string = "repo,public_repo";
		private baseUrl: string = "";
		private branches: any = {};
		private jobQueueHandler: Childprocess.JobQueueHandler;
		private serverConfig: ServerConfiguration;
		constructor(buildFolder: string) {
			this.serverConfig = ServerConfiguration.getServerConfig();
			this.jobQueueHandler = new Childprocess.JobQueueHandler();
			this.baseUrl = this.serverConfig.getBaseUrl() + ":" + this.serverConfig.getServerPort().toString();
			this.branches = this.serverConfig.getBranches();
			ServerConfiguration.getServerConfig().getRepos().forEach(repo => {
				this.pullRequestQueues.push(new PullRequestQueue(buildFolder, repo.name, repo.organization,
					repo.secret, this.jobQueueHandler, this.baseUrl + "/" + this.clientRoot, this.branches) );
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
			var url = urlparser.parse(request.url.toLowerCase(), true);
			var name = url.href.substr(7, url.href.length - 7);
			var header = JSON.parse(JSON.stringify(request.headers));
			switch (<string>request.method) {
				case "POST":
					if (!this.pullRequestQueues.some(queue => { return queue.process(name, request, response, this.baseUrl + "/" + this.clientRoot); })) {
						LocalServer.sendResponse(response, 404, "Not found");
					}
					break;
				case "GET":
					var urlPathList: string[] = url.pathname.split("/");
					var cookieValue: string = LocalServer.getCookieValue(request.headers.cookie, "authorized");
					var accessToken: string = this.findAccessToken(LocalServer.getCookieValue(request.headers.cookie, "authorized"));
					if (url.query.error) {
						console.log("Github ERROR: [" + url.query.error + "] Description: [" + url.query.error_description + "] Uri: [" + url.query.error_uri + "]");
						LocalServer.sendResponse(response, 400, "Github error. See error message in server log");
					}
					else if (url.query.authorized == "no") {
						this.fetchAccessToken(response, url);
					}
					else if (!accessToken) {
						if (url.pathname == "/")
							var redirectUrl = this.baseUrl + "/" + this.clientRoot
						else
							var redirectUrl = this.baseUrl + url.pathname
						response.writeHead(301, { Location: "https://github.com/login/oauth/authorize?scope=" + this.githubScopes + "&client_id=" + this.serverConfig.getClientId() + "&redirect_uri=" + redirectUrl + "?authorized=no" });
						response.end();
					}
					else if (urlPathList[1] + "/" + urlPathList[2] == this.clientRoot) {
							if (urlPathList[3] == "check-privileges") {
								response.writeHead(200, "OK", { "Content-Type": "application/json" });
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
                                        response.end('{ "admin" : "' + isAdmin + '" }');
                                    });
                                });
							}
							else if (url.pathname.split(".").length > 1) {
								var filename = url.pathname.substr(7);
								var contentType = LocalServer.getContentType(filename);
								LocalServer.sendFileResponse(filename, response, contentType);
							}
							else {
								var contentType = LocalServer.getContentType("print-client/index.html");
								LocalServer.sendFileResponse("print-client/index.html", response, contentType);
							}
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
												if (etag != pr.getEtag()) {
													response.writeHead(200, "OK", { "etag": pr.getEtag(), "Content-Type": "application/json" });
													response.end(pr.toJSON());
												}
												else {
													response.writeHead(304, "Not Modified", { "etag": etag });
													response.end();
												}
											}
										}
										else {
											response.writeHead(400, "Bad request", { "Content-Type": "application/json" });
											response.end('{ "error": "You are not authorized to view this repository" }');
										}
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
							response.writeHead(200, "OK", { "Content-Type": "application/json" });
							response.end(JSON.stringify(repos));
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
											LocalServer.sendResponse(response, 200, "OK");
										}
										else if(urlPathList[3] == "nautilus") {
											child_process.spawn("nautilus", ["--browser", path]).on("error", (error: any) => {
												console.log("Failed to spawn gnome-terminal. " + error)
											});
											LocalServer.sendResponse(response, 200, "OK");
										}
										else if(urlPathList[3] == "runtests") {
											pr.processPullRequest()
											LocalServer.sendResponse(response, 200, "OK");
										}
										else if(urlPathList[3] == "download-binaries") {
											var file = "binaries.tar.gz";
											response.setHeader("Content-disposition", "attachment; filename=" + file);
											response.setHeader("Content-type", "application/gzip");
											var filepath = path + "/" + file;
											fs.stat(filepath, (error: any, stats: any) => {
												if (error) {
													response.writeHead(500, "Error when reading file", { "Content-Type": "text/plain" });
													response.end();
												}
												else {
													if (stats.isFile()) {
														var filestream = fs.createReadStream(filepath);
														filestream.pipe(response);
													}
													else {
														response.writeHead(500, "Error when reading file", { "Content-Type": "text/plain" });
														response.end();
													}
												}

											});
										}
									} else
										LocalServer.sendResponse(response, 400, "Bad request");
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
											if (etag != queue.getETag()) {
												response.writeHead(200, "OK", { "etag": queue.getETag(), "Content-Type": "application/json" });
												response.end(queue.toJSON());
											}
											else {
												response.writeHead(304, "Not Modified", { "etag": etag });
												response.end();
											}
										}
										else {
											response.writeHead(400, "Bad request", { "Content-Type": "application/json" });
											response.end('{ "error": "You are not authorized to view this repository" }');
										}
									}).on("error", (error: any) => {
										console.log("Failed when users read right on repo with error: " + error);
									});
								}
							});
						}
						else
							LocalServer.sendResponse(response, 400, "Bad request");
					}
					else
						LocalServer.sendResponse(response, 400, "Bad request");
					break;
				default:
					LocalServer.sendResponse(response, 400, "Bad request");
					break;
			}
		}
		static sendResponse(responseObject: any, code: number, message: string) {
			responseObject.writeHead(code, message, { "Content-Type": "text/plain" });
			responseObject.end();
		}
		static sendFileResponse(localPath: string, responseObject: any, contentType: string) {
			fs.readFile(localPath, (err: any, contents: string) => {
				if (!err) {
					responseObject.writeHead(200, "OK", { "Content-Length": contents.length, "Content-Type": contentType })
					responseObject.end(contents);
				}
				else {
					responseObject.writeHead(500, "Error when reading file", { "Content-Type": "text/plain" });
					responseObject.end();
				}
			});
		}
		static getContentType(filename: string) {
			var ext = filename.split(".").pop();
			var contenttype: string;
			switch (ext) {
				case "html":
					contenttype = "text/html";
					break;
				case "js":
					contenttype = "application/javascript";
					break;
				case "css":
					contenttype = "text/css";
					break;
				case "json":
					contenttype = "application/json";
					break;
				default:
					contenttype = "text/plain";
					break;
			};
			return contenttype;
		}
		private fetchAccessToken(response: any, url: any) {
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
			var post_request = https.request(post_options, (resp: any) => {
				var buffer: string = "";
				resp.on("data", (data: any) => {
					buffer += data;
				});
				resp.on("end", () => {
					var accessToken = <Github.AccessToken>JSON.parse(buffer);
					if (accessToken.error) {
						console.log("Github ERROR: [" + accessToken.error + "] Description: [" + accessToken.error_description + "] Uri: [" + accessToken.error_uri + "]");
						LocalServer.sendResponse(response, 400, "Github error. See error message in server log");
					}
					else {
						this.accessTokens.push(accessToken.access_token);
						var hash = crypt.createHmac("sha1", this.serverConfig.getCookieSecret()).update(accessToken.access_token).digest("hex");
						response.writeHead(301, { "Location": url.pathname + "?authorized=yes", "Set-Cookie": "authorized=" + hash + "; path=/" });
						response.end();
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
