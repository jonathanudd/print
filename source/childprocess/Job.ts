module Print.Childprocess {
	export class Job {
		private name: string;
		private command: string;
		private args: string[];
		private executionPath: string;
		private fallbackJob: Job;
		constructor(name: string, command: string, args: string[], executionPath: string, fallbackJob?: Job) {
			this.name = name;
			this.command = command;
			this.args = args;
			this.executionPath = executionPath;
			this.fallbackJob = fallbackJob;
		}
		getName() { return this.name }
		getCommand() { return this.command }
		getArgs() { return this.args }
		getExecutionPath() { return this.executionPath }
		getFallbackJob() { return this.fallbackJob }
	}
}