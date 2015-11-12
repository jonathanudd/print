/// <reference path="Owner" />

module Print.Github {
	export class Repository {
		name: string;
		full_name: string;
		owner: Owner;
		private: boolean;
	}
}
