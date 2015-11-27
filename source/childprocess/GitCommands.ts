
var execSync = require('child_process').execSync
module Print.Childprocess {
	export class GitCommands {
		private pullRequestNumber: number
		private user: string
		name: string;
		secret: string;
		organization: string;
		constructor(pullRequestNumber: number, user: string, name: string, organization: string) {
			this.pullRequestNumber = pullRequestNumber;
			this.user = user;
			this.name = name;
			this.organization = organization;

		}
		clone(repo: string, branch: string): string {
			try {
				execSync('cd ' + this.pullRequestNumber + ' && git clone -b ' + branch + ' --single-branch https://github.com/' + this.user + '/' + repo);
				return 'OK';
			}
			catch (ex) {
				return 'FAIL';
			}
		}
		merge(repo: string): string {
			try {
				execSync('cd ' + this.pullRequestNumber + '/' + repo + ' && git merge --no-edit upstream/master');
				return 'OK';
			}
			catch (ex) {
				return 'FAIL';
			}
		}
		setUpstream(repo: string, upstream: string): string {
			try {
				execSync('cd ' + this.pullRequestNumber + '/' + repo + ' && git remote add upstream https://github.com/' + upstream + '/' + repo);
				return 'OK';
			}
			catch (ex) {
				return 'FAIL';
			}
		}
		fetch(repo: string): string {
			try {
				execSync('cd ' + this.pullRequestNumber + '/' + repo + ' && git fetch upstream');
				return 'OK';
			}
			catch (ex) {
				return 'FAIL';
			}
		}
		resetToOrigin(repo: string, branch: string): string {
			try {
				execSync('cd ' + this.pullRequestNumber + '/' + repo + ' && git reset --hard origin/' + branch);
				return 'OK';
			}
			catch (ex) {
				return 'FAIL';
			}
		}
		fetchFromOrigin(repo: string): string {
			try {
				execSync('cd ' + this.pullRequestNumber + '/' + repo + ' && git fetch origin');
				return 'OK';
			}
			catch (ex) {
				return 'FAIL';
			}
		}
		/*all() {
		  execSync('git clone -b '+ this.branch + ' --single-branch https://github.com/'+this.user+'/'+this.repo +
		  '&& cd ' + this.pullRequestNumber + ' && git remote add upstream https://github.com/cogneco' + this.repo + '/' + this.repo +
		  ' && git merge --no-edit upstream/master' +
		  ' && git fetch upstream',
		  (error: any, stdout: any, stderr: any) => {
			console.log('stdout: ' + stdout)
			console.log('stderr: ' + stderr)
			if (error !== null) {
			  console.log('exec error: ' + error)
			}
		  })
		}*/
	}
}
