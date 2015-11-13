/// <reference path="Action.ts" />
module Print {
	export class RepositoryConfiguration {
		name: string;
		secondary: string;
		secondaryUpstream : string;
		actions: Action[];
		constructor() {
		}
	}
}
