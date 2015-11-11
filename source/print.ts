/// <reference path="server/LocalServer" />

module Print {
	export class Program {
		private server: Server.LocalServer
		constructor() {
			this.registerKeyEvents()
			this.server = new Server.LocalServer(8082)
			this.server.start()
		}
		registerKeyEvents() {
			// CTRL+C
			process.on("SIGINT", () => {
				this.server.stop()
				process.exit()
			})
		}
	}
}

var program = new Print.Program()
