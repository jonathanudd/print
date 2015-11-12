/// <reference path="server/LocalServer" />
/// <reference path="github/events/Push" />

var fs = require("fs")

module Print {
	export class Program {
		private server: Server.LocalServer
		constructor() {
			this.registerKeyEvents();
			this.server = new Server.LocalServer(48085);
			this.server.start();
		}
		registerKeyEvents() {
			// CTRL+C
			process.on("SIGINT", () => {
				this.server.stop();
				process.exit();
			})
		}
	}
}

var program = new Print.Program();
