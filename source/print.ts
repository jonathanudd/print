/// <reference path="../typings/node/node" />
/// <reference path="server/LocalServer" />
/// <reference path="childprocess/Taskmaster" />
/// <reference path="ServerConfiguration" />
/// <reference path="RepositoryConfiguration" />

var fs = require("fs")

module Print {
	export class Program {
		private server: Server.LocalServer
		constructor() {
			this.registerKeyEvents();
			this.server = new Server.LocalServer("config.json");
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
var program = new Print.Program()
