/// <reference path="User" />

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
		merged: boolean;
		commits: number;
		additions: number;
		deletions: number;
		changed_files: number;
	}
}
