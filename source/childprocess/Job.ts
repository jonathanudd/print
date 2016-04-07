module Print.Childprocess {
	export class Job {
		private name: string;
		private command: string;
		private args: string[];
		private executionPath: string;
		private hideResults: boolean;
		private fallbackJob: Job;
		constructor(name: string, command: string, args: string[], executionPath: string, hideResults: boolean = false, fallbackJob?: Job) {
			this.name = name;
			this.command = command;
			this.args = args;
			this.executionPath = executionPath;
			this.hideResults = hideResults;
			this.fallbackJob = fallbackJob;
		}
		getName() { return this.name }
		getCommand() { return this.command }
		getArgs() { return this.args }
		getExecutionPath() { return this.executionPath }
		hide() { return this.hideResults }
		getFallbackJob() { return this.fallbackJob }
		argsToString() {
			var output = "";
			for(var key in this.args) {
				output = output + this.args[key] + " ";
			}
			return output;
		}

	}
}
