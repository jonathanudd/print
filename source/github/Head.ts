/// <reference path="User" />
/// <reference path="Repository" />

module Print.Github {
	export class Head {
		label: string;
		ref: string;
		sha: string;
		user: User
		repo: Repository
	}
}
