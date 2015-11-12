/// <reference path="../../typings/node/node.d.ts" />
/// <reference path="../configuration/ServerConfiguration" />

/// <reference path="../github/events/PullRequestEvent" />

module Print.Server {
	export class PullRequest {
		constructor(private number: number, event: Github.Events.PullRequestEvent) {
		}
	}
}
