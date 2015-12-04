module Print.Childprocess {
	export class Job {
		private name: string;
		private command: string;
		private args: string[];
		private executionPath: string;
		constructor(name: string, command: string, args: string[], executionPath: string) {
			this.name = name;
			this.command = command;
			this.args = args;
			this.executionPath = executionPath;
		}
		getName() { return this.name }
		getCommand() { return this.command }
		getArgs() { return this.args }
		getExecutionPath() { return this.executionPath }
	}
}