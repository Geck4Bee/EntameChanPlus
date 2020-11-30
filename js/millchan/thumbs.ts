import { parseDataUri } from "Util";
import { Engine } from "./millchan";
import { Archive, isError, MaybeError } from "Util";
import { CMD } from "../ZeroFrame";

declare const Millchan: Engine;

type Callback = () => void;

export class Thumbnails {
	thumbs_data: [string, string | undefined][];
	processed: number;
	callback: Callback;
	user_dir: string;

	constructor(files: Archive[], user_dir: string, callback: Callback) {
		console.debug("Init thumbs processing");
		this.thumbs_data = files
			.filter((file) => file.thumb !== undefined && file.data !== undefined)
			.map((file) => [file.thumb, file.data]);
		this.processed = 0;
		this.callback = callback;
		this.user_dir = user_dir;
	}

	incrementProcessedFile() {
		this.processed++;
		if (this.processed == this.thumbs_data.length) {
			this.callback();
		}
	}

	process() {
		if (this.thumbs_data.length == 0) {
			console.debug("No thumbs to process");
			this.callback();
			return;
		}

		this.thumbs_data.forEach((thumb_data) => {
			let [thumb, data] = thumb_data;
			if (data === undefined) {
				return;
			}
			let filepath = this.user_dir + "/" + thumb;
			let [mimetype, b64data] = parseDataUri(data);
			if (b64data) {
				Millchan.cmd(
					CMD.FILE_WRITE,
					[filepath, b64data],
					(res: MaybeError<string>) => {
						this.incrementProcessedFile();
						if (isError(res)) {
							Millchan.error(res.error);
						}
					}
				);
			} else {
				console.debug(`Error processing thumbs for ${thumb}`);
				this.incrementProcessedFile();
			}
		});
	}
}
