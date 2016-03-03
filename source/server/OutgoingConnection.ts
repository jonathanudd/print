/// <reference path="../../typings/node/node.d.ts" />
/// <reference path="../configuration/ServerConfiguration.ts" />
/// <reference path="../github/AccessToken.ts" />

var http = require("http");
var https = require("https");
var querystring = require("querystring");

module Print.Server {
	export class OutgoingConnection {		
		static sendRequest(options: any, errorMessage: string, secure: boolean, onComplete: (data: string) => void, data?: any) {
			var request: any;
			var callback = (response: any) => {
				var buffer: string = "";
				response.on("data", (data: any) => { buffer += data; });
				response.on("end", () => { onComplete(buffer); });
			}
			if (secure)
				request = https.request(options, callback);
			else
				request = http.request(options, callback);
			request.on("error", (error) => {
				console.log(errorMessage + error.toString())
			});
			
			request.write(querystring.stringify(data));
			request.end();
		}
		static requestUsersAccessToken(code: string, onComplete: (accessToken: Github.AccessToken) => void) {
			var options = {
				hostname: "github.com",
				path: "/login/oauth/access_token",
				method: "POST",
				headers: { "Accept": "application/json" }
			};
			var data = {
				"client_id": ServerConfiguration.getServerConfig().getClientId(),
				"client_secret": ServerConfiguration.getServerConfig().getClientSecret(),
				"code": code
			};
			var errorMessage = "There was an error when fetching and accessToken: ";
			OutgoingConnection.sendRequest(options, errorMessage, data, true, (data: string) => {
				onComplete(<Github.AccessToken>JSON.parse(data));
			});
		}
		static checkUserAccessToRepository(organization: string, repository: string, accessToken: string, onComplete: (hasAccess: boolean) => void) {
			var options = {
				hostname: "api.github.com",
				path: "/repos/" + organization + "/" + repository,
				method: "GET",
				headers: { "User-Agens": "print", "Authorization": "token " + accessToken }
			};
			var errorMessage = "There was and error when checking users access to repository: ";
			OutgoingConnection.sendRequest(options)
		}
	}
}