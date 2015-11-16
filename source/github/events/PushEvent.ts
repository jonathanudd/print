/// <reference path="../Commit" />
/// <reference path="../Repository" />

module Print.Github.Events {
	export class PushEvent  {
		compare: string;
		head_commit: Commit;
		repository: Repository;
	}
}
