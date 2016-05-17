/// <reference path="../childprocess/Action.ts" />
/// <reference path="../childprocess/Repo.ts" />


module Print {
	export class RepositoryConfiguration {
		name: string;
		dependencies: Repo[] = []
		secondary: string;
		secondaryUpstream: string;
		actions: Childprocess.Action[] = []
		constructor() {
		}
	}
}
