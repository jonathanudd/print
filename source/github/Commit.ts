/// <reference path="Author" />

module Print.Github {
	export class Commit {
		message: string;
		timestamp: string;
		url: string;
		author: Author;
		committer: Author;
		added: string[];
		removed: string[];
		modified: string[];
	}
}
