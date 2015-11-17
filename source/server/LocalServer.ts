/// <reference path="../../typings/node/node.d.ts" />
/// <reference path="../configuration/ServerConfiguration" />
/// <reference path="PullRequestQueue" />

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
		constructor(configurationFile: string) {
			this.configurations = ServerConfiguration.readConfigurationFile(configurationFile);
			this.configurations.forEach(configuration => {
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
			var url = urlparser.parse(request.url, true);
			var name = url.href.substr(7, url.href.length - 7);
			switch (<string>request.method) {
				case "POST":
					if (!this.pullRequestQueues.some(queue => { return queue.process(name, request, response); })) {
						LocalServer.sendResponse(response, 404, "Not found");
					}
					break;
				case "GET":
					if (url.pathname == "/") {
						if (url.search == "") {
							response.writeHead(301, {Location: "https://github.com/login/oauth/authorize?scope=user:email&client_id="+process.env.PRINT_CLIENT_ID});
							response.end();
						}
						else if (url.query.code != "") {
							var post_data = querystring.stringify({
								"client_id": process.env.PRINT_CLIENT_ID,
								"client_secret": process.env.PRINT_CLIENT_SECRET,
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
							var post_request = https.request(post_options, function(resp: any) {
								resp.on("data", function(data: any) {
									//
									// TODO: save access_token
									//
									response.writeHead(301, {Location: "/print-client"});
									response.end();
								});
							});
							post_request.write(post_data);
							post_request.end();
						}
					}
					else if (url.pathname.substr(0,13) == "/print-client") {
						var filename: String;
						if (url.pathname == "/print-client")
							filename = "print-client/index.html";
						else
							filename = url.pathname.substr(1);
						var contentType = LocalServer.getContentType(filename);
						LocalServer.sendFileResponse(filename, response, contentType);
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
		static sendFileResponse(localPath: String, responseObject: any, contentType: String) {
			fs.readFile(localPath, function(err: any, contents: String) {
				if(!err) {
					responseObject.writeHead(200, "OK", {"Content-Length": contents.length, "Content-Type": contentType})
					responseObject.end(contents);
				} 
				else {
					responseObject.writeHead(500, "Error when reading file", {"Content-Type": "text/plain"});
					responseObject.end();
				}
			});
		}
		static getContentType(filename: String) {
			var ext = filename.split(".").pop();
			var contenttype: String;
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
	}
}
