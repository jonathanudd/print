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
				this.pullRequestQueues.push(new PullRequestQueue(configuration.name));
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
			})
		}
		private requestCallback(request: any, response: any) {
			var url: string = request.url;
			var name = url.substr(7, url.length - 7);
			switch (<string>request.method) {
				case "POST":
					if (this.pullRequestQueues.some(queue => { return queue.process(name, request); })) {
						request.on("end", () => {
							response.writeHead(200, "OK", { "Content-Type": "text/plain" });
							response.end();
						});
					} else {
						response.writeHead(404, "Not found", { "Content-Type": "text/html" });
						response.end("<html><head><title>404 - Not found</title></head><body><h1>Not found.</h1></body></html>");
					}
					break;
				case "GET":
					console.log("Received a GET request");
				default:
					response.writeHead(400, "Bad request", { "Content-Type": "text/html" });
					response.end("<html><head><title>400 - Bad request</title></head><body><h1>Bad request.</h1></body></html>");
					break;
			}
		}
	}
}
