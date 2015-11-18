
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
		clone(repo: string, branch: string) : number {
			try {
				execSync('cd ' + this.pullRequestNumber + ' && git clone -b '+ branch + ' --single-branch https://github.com/'+this.user+'/'+repo);
		  		return 0;
			}
			catch (ex) {
				return -1;
			}
		}
		merge(repo: string ) : number {
			try {
				execSync('cd ' + this.pullRequestNumber + '/' + repo  + ' && git merge --no-edit upstream/master');
				return 0;
			}
			catch (ex) {
				return -1;
			}
		}
		setUpstream(repo: string, upstream: string) : number {
			try {
				execSync('cd ' + this.pullRequestNumber + '/' + repo +  ' && git remote add upstream https://github.com/' + upstream + '/' + repo);
				return 0;
			}
			catch (ex) {
				return -1;
			}
		}
		fetch(repo: string) : number {
			try {
				execSync('cd ' + this.pullRequestNumber + '/' + repo + ' && git fetch upstream');
				return 0;
			}
			catch (ex) {
				return -1;
			}
		}
		resetToOrigin(repo: string) {
			try {
				execSync('cd ' + this.pullRequestNumber + '/' + repo + ' && git reset --hard origin/master');
				return 0;
			}
			catch (ex) {
				return -1;
			}
		}
		fetchFromOrigin(repo: string) {
			try {
				execSync('cd ' + this.pullRequestNumber + '/' + repo + ' && git fetch origin');
				return 0;
			}
			catch (ex) {
				return -1;
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
