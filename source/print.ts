/// <reference path="../typings/node/node" />
/// <reference path="server/LocalServer" />

var fs = require("fs");

require('scribe-js')();
var console = process.console;
console.addLogger('debug', 'red');
console.addLogger('fun', 'red');
var originalConsole = console["log"];
console["log"] = function() {
   return originalConsole.apply(console, arguments)
}

module Print {
	export class Program {
		private server: Server.LocalServer
		constructor(buildFolder: string) {
			this.registerKeyEvents();
			this.createBuildFolder(buildFolder);
			this.server = new Server.LocalServer(buildFolder);
			this.server.start();
		}
		registerKeyEvents() {
			// CTRL+C
			process.on("SIGINT", () => {
				this.server.stop();
				process.exit();
			})
		}
		createBuildFolder(buildFolder: string) {
			try {
				if (!fs.existsSync(String(buildFolder))) {
					fs.mkdirSync(String(buildFolder));
				}
			}
			catch (ex) {
				console.log(ex);
			}
		}
	}
	
}
var path =  process.env['HOME'] + "/repositories";
var program = new Print.Program(path);
