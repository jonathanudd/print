/// <reference path="Job" />
/// <reference path="ExecutionResult" />
var child_process = require('child_process');

module Print.Childprocess {
	export class JobQueue {
		private name: string;
		private jobs: Job[];
		private currentJob: number;
		private allJobsFinishedCallback: (executionResults: ExecutionResult[]) => void;
		private resultList: ExecutionResult[];
		private currentJobProcess: any;
		private running: boolean;
		constructor(name: string, allJobsFinishedCallback: (executionResults: ExecutionResult[]) => void) {
			this.name = name;
			this.jobs = [];
			this.currentJob = 0;
			this.allJobsFinishedCallback = allJobsFinishedCallback;
			this.resultList = [];
			this.running = false;
		}
		getName() { return this.name }
		addJob(job: Job) {
			this.jobs.push(job);
		}
		runJobs(reportDoneToHandler: () => void) {
			this.running = true;
			this.runJob(this.jobs[this.currentJob], reportDoneToHandler);
		}
		abortRunningJobs() {
			console.log("Aborting job queue for: " + this.name);
			this.currentJobProcess.kill();
			this.reset();
		}
		isRunning() {
			return this.running;
		}
		private runJob(job: Job, reportDoneToHandler: () => void) {
			try {
				var buffer: string;
				this.currentJobProcess = child_process.spawn(job.getCommand(), job.getArgs(), { cwd: job.getExecutionPath() });
				this.currentJobProcess.on("error", (error: any) => {
					console.log(this.name + " failed when spawning: " + job.getName() + " with error: " + error);
				});
				this.currentJobProcess.stdout.on("data", (data: string) => {
					buffer += data;
				});
				this.currentJobProcess.on("close", (code: string, signal: string) => {
					var status = code;
					if (status == undefined || status === null)
						status = signal;
					clearTimeout(timeout);
					if (status != "SIGTERM") {
						console.log(this.name + " finished job: " + job.getName() + " with status: " + status);
						this.resultList.push(new ExecutionResult(job.getName(), status));
						if (this.currentJob < this.jobs.length-1) {
							this.currentJob++;
							this.runJob(this.jobs[this.currentJob], reportDoneToHandler);
						}
						else {
							this.allJobsFinishedCallback(this.resultList.slice());
							this.reset();
							reportDoneToHandler();
						}
					}
				});
				var timeout = setTimeout(() => {
					console.log(this.name + " killing: " + job.getName() + " because of timeout");
					this.currentJobProcess.kill();
				}, 10 * 60 * 1000);
			}
			catch(error) {
				console.log(this.name + " failed when running: " + job.getName() + " with error: " + error); 
			}
		}
		private reset() {
			while (this.jobs.length > 0)
				this.jobs.pop();
			while (this.resultList.length > 0)
				this.resultList.pop();
			this.running = false;
			this.currentJob = 0;
		}
	}
}