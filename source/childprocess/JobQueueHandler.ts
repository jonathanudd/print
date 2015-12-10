/// <reference path="JobQueue" />

module Print.Childprocess {
	export class JobQueueHandler {
		private jobQueues: JobQueue[];
		private runningJobQueues: number;
		private maxRunningJobQueues: number;
		private currentlyRunning: JobQueue[];
		constructor(maxRunningJobQueues: number) {
			this.jobQueues = [];
			this.runningJobQueues = 0;
			this.maxRunningJobQueues = maxRunningJobQueues;
			this.currentlyRunning = [];
		}
		addJobQueue(jobQueue: JobQueue) {
			if (this.runningJobQueues < this.maxRunningJobQueues) {
				this.runningJobQueues++;
				this.currentlyRunning.push(jobQueue);
				jobQueue.runJobs(this.onJobQueueDone.bind(this));
			}
			else {
				this.jobQueues.push(jobQueue);
			}
		}
		onJobQueueDone(id: string) {
			var queueRemoved: boolean = false;
			this.currentlyRunning = this.currentlyRunning.filter((localQueue) => {
				if (id == localQueue.getId())
					queueRemoved = true;
				else
					return true;
			});
			if (queueRemoved) {
				if (this.jobQueues.length > 0) {
					var jobQueueToRun = this.jobQueues.shift();
					this.currentlyRunning.push(jobQueueToRun);
					jobQueueToRun.runJobs(this.onJobQueueDone.bind(this));
				}
				else if (this.runningJobQueues >= 0) {
					this.runningJobQueues--;
				}
			}
			console.log("The following " + this.runningJobQueues.toString() + " job queues are running");
			this.currentlyRunning.forEach(localQueue => {
				console.log("-> " + localQueue.getName());
			});
		}
		abortQueue(queue: JobQueue) {
			if (queue.isRunning())
				queue.abortRunningJobs();
			this.jobQueues = this.jobQueues.filter((localQueue) => {
				return queue.getName() != localQueue.getName();
			});
		}
	}
}