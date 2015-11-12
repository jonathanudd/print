/// <reference path="../../typings/node/node.d.ts" />
/// <reference path="../configuration/ServerConfiguration" />
/// <reference path="PullRequest" />
/// <reference path="../github/events/PullRequestEvent" />

module Print.Server {
	export class PullRequestQueue {
		private request: PullRequest[] = [];
		constructor(private name: string) {
		}
		process(name: string, request: any): boolean {
			var result: boolean;
			//
			// TODO: Do we check the header if this is in fact a pull request event?
			//
			if (result = (name == this.name)) {
				request.on("data", (payload: any) => {
					// here we check if the PR exists in our list
					// event goes into PullRequest where it is sorted out and processed to find out if there was a change
					var event = <Print.Github.Events.PullRequestEvent>JSON.parse(payload);
					console.log(event.pull_request.number);
				})
			}
			return result;
		}
	}
}
