/// <reference path="../ServerConfiguration" />
/// <reference path="../RepositoryConfiguration" />
/// <reference path="GitCommands" />
var execSync = require('child_process').execSync
module Print.Childprocess {
	export class Build {
		private vidprocConfiguration: RepositoryConfiguration;
		private pullRequestNumber: string;
		private user: string;
		private primaryRepository: string;
		private secondaryRepository: string;
		private primaryRepo: ServerConfiguration
		private secondaryRepo: ServerConfiguration
		private branch: string;
		private gitCommands: Childprocess.GitCommands;
		private commands: string;
		constructor(vidprocConfiguration: RepositoryConfiguration, pullRequestNumber: string, user: string,primaryRepo: ServerConfiguration, secondaryRepo: ServerConfiguration, branch: string) {
			this.vidprocConfiguration = vidprocConfiguration;
			this.pullRequestNumber = pullRequestNumber;
			this.user = user;
			this.primaryRepo = primaryRepo;
			this.secondaryRepo = secondaryRepo;
			this.branch = branch;
		}
		setup(repository: string, branch: string, upstream: string) {
			this.gitCommands.clone(repository, branch);
			this.gitCommands.setUpstream(repository, upstream);
			this.gitCommands.fetch(repository);
			this.gitCommands.merge(repository);
		}
		manage() {
			//'736','emilwestergren', 'ooc-kean','add_naivemap')
			execSync('mkdir ' + this.pullRequestNumber, (error: any, stdout: any, stderr: any) => {});
			//this.gitCommands = new Childprocess.GitCommands(this.pullRequestNumber, this.user);
			//this.setup(this.primaryRepo.name, this.branch, this.primaryRepo.upstream);
			//this.setup(this.secondaryRepo.name, this.branch, this.secondaryRepo.upstream);
		}
		build() {
			execSync('cd ' + this.pullRequestNumber + '/' + this.primaryRepo.name + '&& ./build.sh ',
			(error: any, stdout: any, stderr: any) => {
				console.log('stdout: ' + stdout)
				console.log('stderr: ' + stderr)
				if (error !== null) {
					console.log('exec error: ' + error)
				}
			})
		}
		play() {
			execSync('cd ' + this.pullRequestNumber + '/' + this.primaryRepo.name + '&& ./play.sh ' +  __dirname + '/../video/bird.mp4',
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
