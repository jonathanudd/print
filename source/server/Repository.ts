/// <reference path="../github/Repository" />
/// <reference path="User" />

module Print.Server {
	export class Repository {
		private id: string;
		private name: string;
		private fullName: string;
		private owner: User;
		private isPrivate: boolean;
		private isFork: boolean;
		private url: string;
		private pullsUrl: string;
		constructor(repository: Github.Repository) {
			this.id = repository.id;
			this.name = repository.name;
			this.fullName = repository.full_name;
			this.owner = new User(repository.owner);
			this.isPrivate = repository.private;
			this.isFork = repository.fork;
			this.url = repository.url;
			this.pullsUrl = repository.pulls_url;
		}
		toJSON(): string {
			return JSON.stringify({
				"id": this.id,
				"name": this.name,
				"full_name": this.fullName,
				"owner": JSON.parse(this.owner.toJSON()),
				"isPrivate": this.isPrivate,
				"isFork": this.isFork,
				"url": this.url,
				"pullsUrl": this.pullsUrl
			})
		}
	}
}
