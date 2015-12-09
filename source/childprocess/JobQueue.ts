/// <reference path="Job" />
/// <reference path="ExecutionResult" />
var child_process = require('child_process');

module Print.Childprocess {
	export class JobQueue {
		private name: string;
		private jobs: Job[];
		private currentJob: number;
		private allJobsFinishedCallback: (executionResults: ExecutionResult[]) => void;
		private reportDoneToHandler: () => void;
		private resultList: ExecutionResult[];
		private currentJobProcess: any;
		private running: boolean;
		private abort: boolean;
		constructor(name: string, allJobsFinishedCallback: (executionResults: ExecutionResult[]) => void) {
			this.name = name;
			this.jobs = [];
			this.currentJob = 0;
			this.allJobsFinishedCallback = allJobsFinishedCallback;
			this.resultList = [];
			this.running = false;
			this.abort = false;
		}
		getName() { return this.name; }
		getAllJobsFinishedCallback() { return this.allJobsFinishedCallback; }
		addJob(job: Job) {
			this.jobs.push(job);
		}
		runJobs(reportDoneToHandler: () => void) {
			this.reportDoneToHandler = reportDoneToHandler;
			this.running = true;
			this.runJob(this.jobs[this.currentJob]);
		}
		abortRunningJobs() {
			console.log("Aborting job queue for: " + this.name);
			this.abort = true;
			this.currentJobProcess.kill();
		}
		isRunning() {
			return this.running;
		}
		private runJob(job: Job) {
			try {
				var buffer: string = "";
				this.currentJobProcess = child_process.spawn(job.getCommand(), job.getArgs(), { cwd: job.getExecutionPath() });
				this.currentJobProcess.on("error", (error: any) => {
					console.log(this.name + " failed when spawning: " + job.getName() + " with error: " + error);
				});
				this.currentJobProcess.stdout.on("data", (data: string) => {
					buffer += data;
				});
				this.currentJobProcess.stderr.on("data", (data: string) => {
					buffer += data;
				});
				this.currentJobProcess.on("close", (code: string, signal: string) => {
					var status = code;
					if (status == undefined || status === null)
						status = signal;
					clearTimeout(timeout);
					console.log(this.name + " finished job: " + job.getName() + " with status: " + status);
					this.jobEnd(job, status, buffer);
				});
				var timeout = setTimeout(() => {
					console.log(this.name + " killing: " + job.getName() + " because of timeout");
					this.currentJobProcess.kill();
				}, 10 * 60 * 1000);
			}
			catch(error) {
				if (job) {
					console.log(this.name + " failed when running: " + job.getName() + " with error: " + error);
					this.jobEnd(job, "-1", buffer);
				}
				else {
					console.log(this.name + " failed when running: unknown job with error: " + error);
					this.reportDoneToHandler();
				}
			}
		}
		private jobEnd(job: Job, status: string, output: string) {
			if (this.abort) {
				this.reportDoneToHandler();
			}
			else {
				this.resultList.push(new ExecutionResult(job.getName(), status, output));
				if (this.currentJob < this.jobs.length-1) {
					this.currentJob++;
					this.runJob(this.jobs[this.currentJob]);
				}
				else {
					this.allJobsFinishedCallback(this.resultList.slice());
					this.running = false;
					this.reportDoneToHandler();
				}
			}
		}
	}
}