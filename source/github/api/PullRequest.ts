/// <reference path="../../../typings/node/node" />
/// <reference path="../PullRequest" />
/// <reference path="../../server/PullRequest" />

var https = require("https")

module Print.Github.Api {
	export class PullRequest {
		//
		// TODO: Use Github api instead of hardcoded urls
		//
		static queryOpenPullRequests(organization: string, repository: string, token: string, onFinishedCallback: (result: Print.Server.PullRequest[], etag: string) => void) {
			var buffer: string = ""
			var options = {
				hostname: "api.github.com",
				path: "/repos/" + organization + "/" + repository + "/pulls?state=open",
				method: "GET",
				headers: { "User-Agent": "print", "Authorization": "token " + token }
			};
			https.request(options, (response: any) => {
				var header = JSON.parse(JSON.stringify(response.headers));
				var etag: string = header["etag"];
				response.on("data", (chunk: string) => {
					buffer += chunk
				});
				response.on("error", (error: any) => {
					console.log("ERROR:", error.toString());
				});
				response.on("end", () => {
					var result: Server.PullRequest[] = [];
					(<Github.PullRequest[]>JSON.parse(buffer)).forEach(request => {
						var pr = new Server.PullRequest(request);
						pr.processPullRequest();
						result.push(pr);
					});
					onFinishedCallback(result, etag);
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
				var header = JSON.parse(JSON.stringify(response.headers));
				var etag: string = header["etag"];
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
				var header = JSON.parse(JSON.stringify(response.headers));
				var etag: string = header["etag"];
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
	}
}
