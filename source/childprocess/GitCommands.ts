
var exec = require('child_process').exec
module Print.Childprocess {
	export class GitCommands {
		private pullRequestNumber: string
		private user: string
		private repo: string
		private branch: string
		constructor(pullRequestNumber: string, user: string, repo: string, branch: string) {
			this.pullRequestNumber = pullRequestNumber
			this.user = user
			this.repo = repo
			this.branch = branch
		}
		clone() {
			exec('git clone -b '+ this.branch + ' --single-branch https://github.com/'+this.user+'/'+this.repo, (error: any, stdout: any, stderr: any) => {
					console.log('stdout: ' + stdout)
					console.log('stderr: ' + stderr)
					if (error !== null) {
						console.log('exec error: ' + error)
					}
		  })
		}
		merge() {
			exec('cd ' + this.pullRequestNumber + ' && git merge --no-edit upstream/master' , (error: any, stdout: any, stderr: any) => {
					console.log('stdout: ' + stdout)
					console.log('stderr: ' + stderr)
					if (error !== null) {
						console.log('exec error: ' + error)
					}
				})
		}
		setUpstream() {
			exec('cd ' + this.pullRequestNumber + ' && git remote add upstream https://github.com/cogneco' + this.repo + '/' + this.repo , (error: any, stdout: any, stderr: any) => {
					console.log('stdout: ' + stdout)
					console.log('stderr: ' + stderr)
					if (error !== null) {
						console.log('exec error: ' + error)
					}
				})
		}
		fetch() {
			exec('cd ' + this.pullRequestNumber + ' && git fetch upstream', (error: any, stdout: any, stderr: any) => {
				console.log('stdout: ' + stdout)
				console.log('stderr: ' + stderr)
				if (error !== null) {
					console.log('exec error: ' + error)
				}
			})
		}
    all() {
      exec('git clone -b '+ this.branch + ' --single-branch https://github.com/'+this.user+'/'+this.repo +
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
    }
	}
}
