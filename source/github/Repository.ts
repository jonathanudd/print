/// <reference path="User" />

module Print.Github {
	export class Repository {
		id: string;
		name: string;
		full_name: string;
		owner: User;
		private: boolean;
		fork: boolean;
		url: string;
		pulls_url: string;
	}
}
