/// <reference path="../typings/node/node" />
/// <reference path="server/Server" />

var fs = require("fs");

var originalConsole = console["log"];
console["log"] = function() {
    if (arguments[0])
        process.stdout.write("[" + (new Date).toLocaleTimeString() + "] ");
    return originalConsole.apply(console, arguments)
}

module Print {
	export class Program {
		private server: Server.Server
		constructor(buildFolder: string) {
			this.registerKeyEvents();
			this.createBuildFolder(buildFolder);
			this.server = new Server.Server(buildFolder);
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
var homePath =  process.env['HOME'] + "/repositories";
var program = new Print.Program(homePath);