/// <reference path="User" />
/// <reference path="Fork" />

module Print.Github {
	export class PullRequest {
		id: string;
		url: string;
		html_url: string;
		diff_url: string;
		number: number;
		state: string;
		title: string;
		user: User;
		body: string;
		created_at: string;
		updated_at: string;
		head: Fork;
		base: Fork;
		merged: boolean;
		commits: number;
		additions: number;
		deletions: number;
		changed_files: number;
	}
}
