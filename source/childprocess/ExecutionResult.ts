module Print.Childprocess {
	export class ExecutionResult {
		constructor(private task: string, private result: string, private output: string) {
			this.task = task;
			this.result = result;
			this.output = output;
		}
		getTask(): string { return this.task; }
		getResult(): string { return this.result; }
		getOutput(): string { return this.output; }
		toJSON(): string {
			return JSON.stringify({
				"task": this.task,
				"result": this.result,
				"output": this.output
			});
		}
	}
}
