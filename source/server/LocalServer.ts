/// <reference path="../../typings/node/node.d.ts" />
/// <reference path="../configuration/ServerConfiguration" />
/// <reference path="PullRequestQueue" />
/// <reference path="../github/AccessToken.ts" />

var http = require("http");
var urlparser = require("url");
var querystring = require("querystring");
var fs = require("fs");

module Print.Server {
	export class LocalServer {
		private server: any;
		private port = 48085;
		private configurations: ServerConfiguration[] = [];
		private pullRequestQueues: PullRequestQueue[] = [];
		private clientId: string = "";
		private clientSecret: string = "";
		private accessTokens: string[] = [];
		private clientRoot: string = "print-client";
		private printApiRoot: string = "print";
		private githubScopes: string = "user:email";
		private authUrl: string = "http://127.0.0.1:48085/" + this.clientRoot + "/auth"
		constructor(configurationFile: string) {
			this.configurations = ServerConfiguration.readConfigurationFile(configurationFile);
			this.configurations.forEach(configuration => {
				this.clientId = configuration.clientId;
				this.clientSecret = configuration.clientSecret;
				this.pullRequestQueues.push(new PullRequestQueue(configuration.name, configuration.organization, configuration.secret));
			});
			this.server = http.createServer((request: any, response: any) => {
				this.requestCallback(request, response)
			});
		}
		start() {
			this.server.listen(this.port, () => {
				console.log("listening on port " + this.port);
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
					if (!this.pullRequestQueues.some(queue => { return queue.process(name, request, response); })) {
						LocalServer.sendResponse(response, 404, "Not found");
					}
					break;
				case "GET":
					var urlPathArray: string[] = url.pathname.split("/");
					if (url.query.error) {
						console.log("Github ERROR: [" + url.query.error + "] Description: [" + url.query.error_description + "] Uri: [" + url.query.error_uri + "]");
						LocalServer.sendResponse(response, 400, "Github error. See error message in server log");
					}
					else if (url.pathname == "/" + this.clientRoot + "/auth") {
						this.fetchAccessToken(response, url);
					}
					else if (this.accessTokens.indexOf(request.headers.cookie) < 0) {
						response.writeHead(301, { Location: "https://github.com/login/oauth/authorize?scope=" + this.githubScopes + "&client_id=" + this.clientId + "&redirect_uri=" + this.authUrl});
						response.end();
					}
					else if (urlPathArray[1] == this.clientRoot) {
							var filename: string;
							if (url.pathname == "/" + this.clientRoot)
								filename = "print-client/index.html";
							else
								filename = url.pathname.substr(1);
							var contentType = LocalServer.getContentType(filename);
							LocalServer.sendFileResponse(filename, response, contentType);
					}
					else if (urlPathArray[1] == this.printApiRoot) {
						if (urlPathArray[3] == "pr") {
							var repo = urlPathArray[2];
							this.pullRequestQueues.forEach(queue => {
								if (queue.getName() == repo) {
									var pr = queue.find(urlPathArray[4]);
									if (pr) {
										response.writeHead(200, "OK", { "Content-Type": "application/json" })
										response.end(pr.toJSON());
									}
								}
							});
						}
						else if (urlPathArray[2] == "repolist") {
							var repos: string[] = [];
							this.pullRequestQueues.forEach(queue => {
								repos.push(queue.getName());
							});
							response.writeHead(200, "OK", { "Content-Type": "application/json" })
							response.end(JSON.stringify(repos));
						}
						else if (urlPathArray[2]) {
							var repo = urlPathArray[2];
							this.pullRequestQueues.forEach(queue => {
								if (queue.getName() == repo) {
									var etag: string = header["etag"];
									if (etag != queue.getETag()) {
										response.writeHead(200, "OK", { "etag": queue.getETag(), "Content-Type": "application/json" })
										response.end(queue.toJSON());
									} 
									else {
										response.writeHead(304, "Not Modified", { "etag": etag })
										response.end();
									}
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
				"client_id": this.clientId,
				"client_secret": this.clientSecret,
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
						response.writeHead(301, { "Location": "/" + this.clientRoot, "Set-Cookie": accessToken.access_token + "; path=/"});
						response.end();
					}
				});
			});
			post_request.write(post_data);
			post_request.end();
		}
	}
}
