module Print.Childprocess {
	export class ExecutionResult {
		constructor(private task: string, private result: string) {
			this.task = task;
			this.result = result;
		}
		getTask(): string { return this.task; }
		getResult(): string { return this.result; }
		toJSON(): string {
			return JSON.stringify({
				"task": this.task,
				"result": this.result
			});
		}
	}
}
