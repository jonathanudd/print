/// <reference path="../../typings/node/node.d.ts" />
var http = require("http");
var fs = require("fs");
var path = require("path");

module Print.Server {
	export class IncommingConnection {		
		constructor(private response: any) {}
		write(message: string, statusCode: number, headers?: any) {
			if (!headers)
				headers = { "Content-Type": "text/html" };
			this.response.writeHead(statusCode, http.STATUS_CODES[statusCode], headers);
			this.response.write(message);
			this.response.end();
		}
		writeFile(file: string, download: boolean = false) {
			fs.stat(file, (error: any, stats: any) => {
				if (error)
					this.write("Not found", 404, { "Content-Type": "text/html" });
				else {
					fs.readFile(file, (error: any, data: any) => {
						if (error)
							this.write("Not found", 404, { "Content-Type": "text/html" });
						else {
							var contentType = IncommingConnection.contentType(file);
							var headers: any = { "Content-Length": data.length, "Content-Type": contentType };
							if (download)
								headers = { "Content-Length": data.length, "Content-Type": contentType, "Content-Disposition": "attachment; filename=" + path.basename(file) };
							this.write(data, 200, headers);
						}
					});
				}
			});
		}
		private static contentType(file: string): string {
			var contentTypes: any  = {".html": "text/html; charset=utf8",
				".txt": "text/plain",
				".js": "application/javascript",
				".gif": "image/gif",
				".json": "application/json; charset=UTF-8",
				".css": "text/css; charset=UTF-8",
				".csv": "text/csv; charset=UTF-8",
				".mp4": "video/mp4",
				".webm": "video/webm",
				".png": "image/png",
				".jpg": "image/jpeg",
				".jpeg": "image/jpeg",
				".svg": "image/svg+xml",
				".pdf": "application/pdf",
				".xml": "application/xml",
				".zip": "application/zip",
				".woff": "application/font-woff",
				".gz": "application/gzip"};
			return (path.extname(file) in contentTypes) ? contentTypes[path.extname(file)] : null;
		}
	}
}