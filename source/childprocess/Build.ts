
/// <reference path="GitCommands" />
var exec = require('child_process').exec
module Print.Childprocess {
	export class Build {
		private pullRequestNumber: string
		private user: string
		private repo: string
		private branch: string
		private gitCommands: Childprocess.GitCommands
		constructor(pullRequestNumber: string, user: string, repo: string, branch: string) {
			this.pullRequestNumber = pullRequestNumber
			this.user = user
			this.repo = repo
			this.branch = branch
			this.gitCommands = new Childprocess.GitCommands(this.pullRequestNumber, this.user, this.repo, this.branch)
		}
		setup() {
			this.gitCommands.clone()
			this.gitCommands.setUpstream()
			this.gitCommands.fetch()
			this.gitCommands.merge()
			//this.gitCommands.all()
		}
		build() {
			exec('cd ' + this.pullRequestNumber + ' && ./tools/validate.sh', (error: any, stdout: any, stderr: any) => {
				console.log('stdout: ' + stdout)
				console.log('stderr: ' + stderr)
				if (error !== null) {
					console.log('exec error: ' + error)
				}
			})
		}


	}
}
