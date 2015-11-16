
var execSync = require('child_process').execSync
module Print.Childprocess {
	export class GitCommands {
		private pullRequestNumber: string
		private user: string
		name: string;
		secret: string;
		organization: string;
		constructor(pullRequestNumber: string, user: string, name: string, organization: string) {
			this.pullRequestNumber = pullRequestNumber;
			this.user = user;
			this.name = name;
			this.organization = organization;

		}
		clone(repo: string, branch: string) {
			execSync('cd ' + this.pullRequestNumber + ' && git clone -b '+ branch + ' --single-branch https://github.com/'+this.user+'/'+repo,
			 (error: any, stdout: any, stderr: any) => {
					console.log('stdout: ' + stdout)
					console.log('stderr: ' + stderr)
					if (error !== null) {
						console.log('exec error: ' + error)
					}
		  })
		}
		merge(repo: string ) {
			execSync('cd ' + this.pullRequestNumber + '/' + repo  + ' && git merge --no-edit upstream/master' ,
			(error: any, stdout: any, stderr: any) => {
					console.log('stdout: ' + stdout)
					console.log('stderr: ' + stderr)
					if (error !== null) {
						console.log('exec error: ' + error)
					}
				})
		}
		setUpstream(repo: string, upstream: string) {
			execSync('cd ' + this.pullRequestNumber + '/' + repo +  ' && git remote add upstream https://github.com/' + upstream + '/' + repo ,
			(error: any, stdout: any, stderr: any) => {
					console.log('stdout: ' + stdout)
					console.log('stderr: ' + stderr)
					if (error !== null) {
						console.log('exec error: ' + error)
					}
				})
		}
		fetch(repo: string) {
			execSync('cd ' + this.pullRequestNumber + '/' + repo + ' && git fetch upstream',
			(error: any, stdout: any, stderr: any) => {
				console.log('stdout: ' + stdout)
				console.log('stderr: ' + stderr)
				if (error !== null) {
					console.log('exec error: ' + error)
				}
			})
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
