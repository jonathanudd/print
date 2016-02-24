/// <reference path="../github/Label" />

module Print.Server {
	export class Label {
		private url: string;
        private name: string;
        private color: string;
		constructor(label: Github.Label) {
			this.url = label.url;
            this.name = label.name;
            this.color = label.color;
		}
		getUrl(): string { return this.url; }
        getName(): string { return this.name; }
        getColor(): string { return this.color; }
		toJSON(): string {
			return JSON.stringify({
                "name": this.name,
                "color": this.color
			});
		}
	}
}
