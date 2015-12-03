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
		constructor(name: string, allJobsFinishedCallback: (executionResults: ExecutionResult[]) => void) {
			this.name = name;
			this.jobs = [];
			this.currentJob = 0;
			this.allJobsFinishedCallback = allJobsFinishedCallback;
			this.resultList = [];
		}
		addJob(job: Job) {
			this.jobs.push(job);
		}
		runJobs() {
			this.runJob(this.jobs[this.currentJob]);
		}
		private runJob(job: Job) {
			try {
				var runningJob = child_process.spawn(job.getCommand(), job.getArgs(), { cwd: job.getExecutionPath() });
				var buffer: string;
				runningJob.stdout.on("data", (data: string) => {
					buffer += data;
				});
				runningJob.on("close", (code: string, signal: string) => {
					var status = code;
					if (status == undefined || status === null)
						status = signal;
					clearTimeout(timeout);
					console.log(this.name + " finished job: " + job.getName() + " with status: " + status);
					this.resultList.push(new ExecutionResult(job.getName(), status));
					if (this.currentJob < this.jobs.length-1) {
						this.currentJob++;
						this.runJob(this.jobs[this.currentJob]);
					}
					else {
						this.allJobsFinishedCallback(this.resultList);
					}
				});
				var timeout = setTimeout(() => {
					console.log(this.name + " killing: " + job.getName() + " because of timeout");
					runningJob.kill();
				}, 3 * 60 * 1000);
			}
			catch(error) {
				console.log(this.name + " failed when running: " + job.getName() + " with error: " + error); 
			}
		}
	}
}