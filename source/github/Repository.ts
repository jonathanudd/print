/// <reference path="Owner" />

module Print.Github {
	export class Repository {
		id: string;
		name: string;
		full_name: string;
		owner: Owner;
		private: boolean;
		fork: boolean;
		url: string;
		pulls_url: string;
	}
}
