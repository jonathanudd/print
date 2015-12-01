
var execSync = require('child_process').execSync
var child_process = require('child_process')
module Print.Childprocess {
	export class GitCommands {
		private token: string;
		private pullRequestNumber: number
		private path : string;
		private user: string
		name: string;
		secret: string;
		organization: string;
		constructor(token: string, pullRequestNumber: number, path: string, user: string, name: string, organization: string) {
			this.token = token;
			this.pullRequestNumber = pullRequestNumber;
			this.path = path;
			this.user = user;
			this.name = name;
			this.organization = organization;

		}
		clone(repo: string, branch: string): string {
			console.log(this.path);
			try {
				execSync('cd ' + this.path + ' && git clone -b ' + branch + ' --single-branch https://' + this.token + '@github.com/' + this.user + '/' + repo);
				return '0';
			}
			catch (ex) {
				return '-1';
			}
		}
		cloneFromUser(user: string, repo: string, branch: string): string {
			try {
				execSync('cd ' + this.path + ' && git clone -b ' + branch + ' --single-branch https://' + this.token + '@github.com/' + user + '/' + repo);
				return '0';
			}
			catch (ex) {
				return '-1';
			}
		}

		merge(repo: string): string {
			try {
				execSync('cd ' + this.path + '/' + repo + ' && git merge --no-edit upstream/master');
				return '0';
			}
			catch (ex) {
				return '-1';
			}
		}
		setUpstream(repo: string, upstream: string): string {
			try {
				execSync('cd ' + this.path + '/' + repo + ' && git remote add upstream https://github.com/' + upstream + '/' + repo);
				return '0';
			}
			catch (ex) {
				return '-1';
			}
		}
		fetch(repo: string): string {
			try {
				execSync('cd ' + this.path + '/' + repo + ' && git fetch upstream');
				return '0';
			}
			catch (ex) {
				return '-1';
			}
		}
		pull(owner: string,repo: string, branch: string): string {
			var url = 'https://' + this.token + '@github.com/' + owner + '/' + repo;
			try {
				execSync('cd ' + this.path + '/' + repo + ' && git pull ' + url + ' ' + branch);
				return '0';
			}
			catch (ex) {
				return '-1';
			}			
		}
		resetToFirstHead(repo: string): string {
			try {
				execSync('cd ' + this.path + '/' + repo + ' && git reset --hard HEAD~0' );
				return '0';
			}
			catch (ex) {
				return '-1';
			}
		}
		resetToOrigin(repo: string, branch: string): string {
			var url = 'https://' + this.token + '@github.com/' + this.user + '/' + repo;
			try {
				execSync('cd ' + this.path + '/' + repo + ' && git fetch ' + url + ' && git reset --hard origin/' + branch);
				return '0';
			}
			catch (ex) {
				return '-1';
			}
		}
		fetchFromOrigin(repo: string): string {
			try {
				execSync('cd ' + this.path + '/' + repo + ' && git fetch origin');
				return '0';
			}
			catch (ex) {
				return '-1';
			}
		}
	}
}
