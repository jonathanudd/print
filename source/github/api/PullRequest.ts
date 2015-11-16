/// <reference path="../../../typings/node/node" />
/// <reference path="../PullRequest" />
/// <reference path="../../server/PullRequest" />

var https = require("https")

module Print.Github.Api {
	export class PullRequest {
		//
		// TODO: Use Github api instead of hardcoded urls
		//
		static queryOpenPullRequests(organization: string, repository: string, onFinishedCallback: (result: Print.Server.PullRequest[]) => void) {
			var buffer: string = ""
			var options = {
				hostname: "api.github.com",
				path: "/repos/" + organization + "/" + repository + "/pulls?state=open",
				method: "GET",
				headers: { "User-Agent": "print" }
			};
			https.request(options, (response: any) => {
				response.on("data", (chunk: string) => {
					buffer += chunk
				});
				response.on("error", (error: any) => {
					console.log("ERROR:", error.toString());
				});
				response.on("end", () => {
					var result: Server.PullRequest[] = [];
					(<Github.PullRequest[]>JSON.parse(buffer)).forEach(request => {
						result.push(new Server.PullRequest(request));
					});
					onFinishedCallback(result);
				});
			}).end();
		}
	}
}
