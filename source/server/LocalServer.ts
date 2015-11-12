/// <reference path="../../typings/node/node.d.ts" />

var http = require("http")

module Print.Server {
	export class LocalServer {
		private server: any;
		constructor(private port: number) {
			this.server = http.createServer(this.requestCallback);
		}
		start() {
			this.server.listen(this.port, () => {
				console.log("listening on port " + this.port);
			});
		}
		stop() {
			this.server.close(() => {
				console.log("Print server closed");
			})
		}
		private requestCallback(request: any, response: any) {
			switch (request.url) {
				//
				// TODO: use config file
				//
				case "/print/webhooks-test":
					if (request.method == "POST") {
						request.on("data", (payload: any) => {
							request.headers; // kind of event
							console.log(request.headers);
							//payload.toString() // payload (JSON)
						});
						request.on("end", () => {
							response.writeHead(200, "OK", { "Content-Type": "text/plain" });
							response.end();
						});
					} else {
						response.writeHead(404, "Not found", { "Content-Type": "text/html" });
						response.end("<html><head><title>404 - Not found</title></head><body><h1>Not found.</h1></body></html>");
						console.log("[404] " + request.method + " to " + request.url);
					}
					break;
				default:
					response.writeHead(404, "Not found", { "Content-Type": "text/html" });
					response.end("<html><head><title>404 - Not found</title></head><body><h1>Not found.</h1></body></html>");
					console.log("[404] " + request.method + " to " + request.url);
			};
		}
	}
}
