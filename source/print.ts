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
//var program = new Print.Program()

var vidprocConfigJSON = fs.readFileSync("ooc-vidproc.json", "utf-8");
var vidprocConfig: Print.RepositoryConfiguration = JSON.parse(vidprocConfigJSON);

var vidproc =  new Print.ServerConfiguration2('ooc-vidproc', '1234', 'vidhance')
var cogneco =  new Print.ServerConfiguration2('ooc-kean', '1234', 'cogneco')

var tm = new Print.Childprocess.Taskmaster('736','emilwestergren', vidproc,'master');
//var tm = new Print.Childprocess.Taskmaster('750','emilwestergren', cogneco,'remove_bind');
//var build = new Print.Childprocess.Build('736','emilwestergren', 'ooc-vidproc', 'ooc-kean','master');
tm.manage();
//tm.build()
//tm.play();
//var json = fs.readFileSync("config.json", "utf-8")
//var config: Array<Print.ServerConfiguration> = JSON.parse(json);
//console.log(config[0].name)

/*
var json = fs.readFileSync("ooc-vidproc.json", "utf-8");
var config: Print.RepositoryConfiguration = JSON.parse(json);

console.log(config.name);
console.log(config.secondary);
console.log(config.todo[0]);
console.log(config.todo[1]);
console.log(config.todo[2]);
*/
