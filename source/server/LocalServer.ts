/// <reference path="../../typings/node/node.d.ts" />
/// <reference path="../configuration/ServerConfiguration" />
/// <reference path="PullRequestQueue" />

var http = require("http");

module Print.Server {
	export class LocalServer {
		private server: any;
		private port = 48085;
		private configurations: ServerConfiguration[] = [];
		private pullRequestQueues: PullRequestQueue[] = [];
		constructor(configurationFile: string) {
			this.configurations = ServerConfiguration.readConfigurationFile(configurationFile);
			this.configurations.forEach(configuration => {
				this.pullRequestQueues.push(new PullRequestQueue(configuration.name, configuration.organization));
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
				console.log("print server closed");
			});
		}
		private requestCallback(request: any, response: any) {
			var url: string = request.url;
			var name = url.substr(7, url.length - 7);
			switch (<string>request.method) {
				case "POST":
					if (this.pullRequestQueues.some(queue => { return queue.process(name, request); })) {
						request.on("end", () => {
							this.sendResponse(response, 200, "OK");
						});
					} else {
						this.sendResponse(response, 404, "Not found");
					}
					break;
				case "GET":
					console.log("Received a GET request - responding with [400: Bad request]");
				default:
					this.sendResponse(response, 400, "Bad request");
					break;
			}
		}
		private sendResponse(responseObject: any, code: number, message: string) {
			responseObject.writeHead(code, message, { "Content-Type": "text/plain" });
			responseObject.end();
		}
	}
}
