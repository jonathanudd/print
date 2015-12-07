/// <reference path="../../../typings/node/node" />
/// <reference path="../PullRequest" />
/// <reference path="../../server/PullRequestQueue" />
/// <reference path="../../server/PullRequest" />
/// <reference path="../../childprocess/JobQueueHandler" />

var https = require("https")
var url = require("url");

module Print.Github.Api {
	export class PullRequest {
		//
		// TODO: Use Github api instead of hardcoded urls
		//
		static queryOpenPullRequests(path: string, organization: string, repository: string, token: string, jobQueueHandler: Childprocess.JobQueueHandler, parentQueue: Server.PullRequestQueue, onFinishedCallback: (result: Print.Server.PullRequest[]) => void) {
			var buffer: string = ""
			var options = {
				hostname: "api.github.com",
				path: "/repos/" + organization + "/" + repository + "/pulls?state=open",
				method: "GET",
				headers: { "User-Agent": "print", "Authorization": "token " + token }
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
						var pr = new Server.PullRequest(request, token, path, jobQueueHandler, parentQueue);
						pr.processPullRequest();
						result.push(pr);
					});
					onFinishedCallback(result);
				});
			}).end();
		}
		static getTeamMembers(teamID: string,token: string, onFinishedCallback: (result: Print.Github.User[]) => void) {
			var buffer: string = "";
			var options = {
				hostname: "api.github.com",
				path: "/teams/" + teamID + "/members",
				method: "GET",
				headers: { "User-Agent": "print", "Authorization": "token " + token }
			};
			https.request(options, (response: any) => {
				response.on("data", (chunk: string) => {
					buffer += chunk
				});
				response.on("error", (error: any) => {
					console.log("ERROR:", error.toString());
				});
				response.on("end", () => {
					var userList = <Github.User[]>JSON.parse(buffer);
					onFinishedCallback(userList);
				});
			}).end();
		}
		static getTeamID(organization: string, teamName: string,token: string, onFinishedCallback: (teamID: string) => void) {
			var buffer: string = "";
			var options = {
				hostname: "api.github.com",
				path: "/orgs/" + organization + "/teams",
				method: "GET",
				headers: { "User-Agent": "print","Authorization": "token " + token},
			};
			https.request(options, (response: any) => {
				response.on("data", (chunk: string) => {
					buffer += chunk
				});
				response.on("error", (error: any) => {
					console.log("ERROR:", error.toString());
				});
				response.on("end", () => {
					var teamList = <Github.Team[]>JSON.parse(buffer);
					teamList = teamList.filter((team) => {
						return team.name == teamName;
					});
					onFinishedCallback(teamList[0].id);
				});
			}).end();
		}
		static updateStatus(state: string, description: string, status_url: string, token: string) {
			var post_data = JSON.stringify({
				"state": state,
				"target_url": "https://github.com/vidhance",
				"description": description,
				"context": "PRInt"
			});
			var parsedPath = url.parse(status_url).pathname
			var post_options = {
				host: "api.github.com",
				path: parsedPath,
				method: "POST",
				headers: {
					"User-Agent": "print",
					"Accept": "application/json",
					"Content-Type": "application/json",
					"Content-Length": Buffer.byteLength(post_data),
					"Authorization": "token " + token
				}
			};
			var post_request = https.request(post_options);
			post_request.write(post_data);
			post_request.end();
  
		}
	}
}
