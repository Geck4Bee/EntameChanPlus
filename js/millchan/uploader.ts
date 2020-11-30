import { CMD } from "ZeroFrame";
import { Engine } from "./millchan";

declare const Millchan: Engine;

export class WebsocketUploader {
	inner_path: string;
	size: number = 0;
	ws: WebSocket | null = null;
	// `promise` and `resolve` are used to
	// sync communication between server and client
	promise: Promise<void>;
	resolve: () => void = () => {};

	constructor(inner_path: string, size: number) {
		this.inner_path = inner_path;
		this.size = size;
		this.promise = new Promise((resolve) => {
			this.resolve = resolve;
		});
	}

	start(): Promise<void> {
		return new Promise((resolve) => {
			Millchan.cmd(
				CMD.BIG_FILE_UPLOAD_INIT,
				[this.inner_path, this.size, "websocket"],
				(init_res) => {
					const { url } = init_res;
					const origin = location.href
						.replace(/(\:\/\/.*?)\/.*/, "$1")
						.replace("http", "ws");
					this.ws = new WebSocket(url.replace("{origin}", origin));
					this.ws.onmessage = (e) => {
						if (e.data == "poll") {
							this.resolve();
						} else {
							this.close();
						}
					};
					this.ws.onerror = (err) => {
						console.log("err", err);
					};
					this.ws.onopen = () => {
						console.log("opened ws connection");
					};
					resolve();
				}
			);
		});
	}

	private close() {
		console.log("closed ws connection");
		this.ws?.close();
	}

	// uploader should be started before writing
	write(chunk: string): Promise<void> {
		return new Promise(async (resolve) => {
			// The endpoint will shit itself if the payload is too big
			const chunkSize = 1024 * 1024;
			while (chunk.length) {
				await this.promise;
				this.promise = new Promise((resolve) => {
					this.resolve = resolve;
				});
				this.ws?.send(chunk.slice(0, chunkSize));
				chunk = chunk.slice(chunkSize);
			}
			resolve();
		});
	}
}
