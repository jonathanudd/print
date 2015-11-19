module Print {
	export class ExecutionResult {
		constructor(private task: string, private result : string) {
			this.task = task;
			this.result = result;
		}
		getTask(): string { return this.task; }
		getResult(): string { return this.result; }
	}
}
