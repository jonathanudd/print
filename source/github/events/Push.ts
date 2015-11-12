/// <reference path="../Commit" />
/// <reference path="../Repository" />

module Print.Github {
	export class Push  {
		compare: string;
		head_commit: Commit;
		repository: Repository;
	}
}
