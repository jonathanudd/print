module Print {
	export class ExecutionResult {
		task: string;
		result: string;
		constructor(task : string, result : string) {
			this.task = task;
			this.result = result;
		}
	}
}
