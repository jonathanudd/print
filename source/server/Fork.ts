/// <reference path="../github/Fork" />
/// <reference path="User" />
/// <reference path="Repository" />

module Print.Server {
	export class Fork {
		private label: string;
		private ref: string;
		private sha: string;
		private user: User;
		private repository: Repository;
		constructor(fork: Github.Fork) {
			this.label = fork.label;
			this.ref = fork.ref;
			this.sha = fork.sha;
			this.user = new User(fork.user);
			this.repository = new Repository(fork.repo);
		}
		toJSON(): string {
			return JSON.stringify({
				"label": this.label,
				"ref": this.ref,
				"sha": this.sha,
				"user": JSON.parse(this.user.toJSON()),
				"repository": JSON.parse(this.repository.toJSON())
			});
		}
	}
}
