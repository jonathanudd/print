/// <reference path="../github/User" />

module Print.Server {
	export class User {
		private username: string
		constructor(user: Github.User) {
			this.username = user.login;			
		}
		getUsername(): string { return this.username; }
		toJSON(): string {
			return JSON.stringify({
				"username": this.username
			});
		}
	}
}
