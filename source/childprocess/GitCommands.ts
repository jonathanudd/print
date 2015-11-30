
var execSync = require('child_process').execSync
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
				return 'OK';
			}
			catch (ex) {
				return 'FAIL';
			}
		}
		cloneFromUser(user: string, repo: string, branch: string): string {
			try {
				execSync('cd ' + this.path + ' && git clone -b ' + branch + ' --single-branch https://' + this.token + '@github.com/' + user + '/' + repo);
				return 'OK';
			}
			catch (ex) {
				return 'FAIL';
			}
		}

		merge(repo: string): string {
			try {
				execSync('cd ' + this.path + '/' + repo + ' && git merge --no-edit upstream/master');
				return 'OK';
			}
			catch (ex) {
				return 'FAIL';
			}
		}
		setUpstream(repo: string, upstream: string): string {
			try {
				execSync('cd ' + this.path + '/' + repo + ' && git remote add upstream https://github.com/' + upstream + '/' + repo);
				return 'OK';
			}
			catch (ex) {
				return 'FAIL';
			}
		}
		fetch(repo: string): string {
			try {
				execSync('cd ' + this.path + '/' + repo + ' && git fetch upstream');
				return 'OK';
			}
			catch (ex) {
				return 'FAIL';
			}
		}
		pull(owner: string,repo: string, branch: string): string {
			var url = 'https://' + this.token + '@github.com/' + owner + '/' + repo;
			try {
				execSync('cd ' + this.path + '/' + repo + ' && git pull ' + url + ' ' + branch);
				return 'OK';
			}
			catch (ex) {
				return 'FAIL';
			}			
		}
		resetToOrigin(repo: string, branch: string): string {
			var url = 'https://' + this.token + '@github.com/' + this.user + '/' + repo;
			try {
				execSync('cd ' + this.path + '/' + repo + ' && git fetch ' + url + ' && git reset --hard origin/' + branch);
				return 'OK';
			}
			catch (ex) {
				return 'FAIL';
			}
		}
		fetchFromOrigin(repo: string): string {
			try {
				execSync('cd ' + this.path + '/' + repo + ' && git fetch origin');
				return 'OK';
			}
			catch (ex) {
				return 'FAIL';
			}
		}
	}
}
