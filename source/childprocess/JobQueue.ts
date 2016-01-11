/// <reference path="Job" />
/// <reference path="ExecutionResult" />
var child_process = require('child_process');

module Print.Childprocess {
	export class JobQueue {
		private name: string;
		private jobs: Job[];
		private currentJob: number;
		private updateExecutionResults: (executionResults: ExecutionResult[], allJobsComplete: boolean) => void;
		private reportDoneToHandler: (id: string) => void;
		private resultList: ExecutionResult[];
		private currentJobProcess: any;
		private running: boolean;
		private abort: boolean;
		private id: string;
		constructor(name: string, idNumber: number,  updateExecutionResults: (executionResults: ExecutionResult[], allJobsComplete: boolean) => void) {
			this.name = name;
			this.id = name + " " + idNumber.toString();
			this.jobs = [];
			this.currentJob = 0;
			this.updateExecutionResults = updateExecutionResults;
			this.resultList = [];
			this.running = false;
			this.abort = false;
		}
		getName() { return this.name; }
		getId() { return this.id; }
		getUpdateExecutionResultsCallback() { return this.updateExecutionResults; }
		addJob(job: Job) {
			this.jobs.push(job);
		}
		runJobs(reportDoneToHandler: (id: string) => void) {
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
					this.reportDoneToHandler(this.id);
				}
			}
		}
		private jobEnd(job: Job, status: string, output: string) {
			if (this.abort) {
				this.reportDoneToHandler(this.id);
			}
			else {
				if (!job.hide()) {
					this.resultList.push(new ExecutionResult(job.getName(), status, output));
					this.updateExecutionResults(this.resultList.slice(), false);
				}
				if (job.getFallbackJob() && status != "0") {
					console.log(this.name + " running fallback job for " + job.getName());
					this.runJob(job.getFallbackJob());
				}
				else if (this.currentJob < this.jobs.length-1) {
					this.currentJob++;
					this.runJob(this.jobs[this.currentJob]);
				}
				else {
					this.updateExecutionResults(this.resultList.slice(), true);
					this.running = false;
					this.reportDoneToHandler(this.id);
				}
			}
		}
	}
}