import { uniqueFilename, fileUniqueKey } from "Util";

// @ts-ignore
import Worker from "./thumbs.worker";
// @ts-ignore
import store from "store";
import { Archive } from "Util";
import { Engine } from "./millchan";
import { Config } from "./config";
import { CMD } from "ZeroFrame";

declare const config: Config;
declare const Millchan: Engine;

const MIME_PNG: MimeType = "image/png";
const MIME_JPEG: MimeType = "image/jpeg";
const MIME_WEBP: MimeType = "image/webp";

type MaybeArchive = Archive | null;
type MimeType = string;
type Source = HTMLImageElement | HTMLCanvasElement;

interface Job {
	file: Archive;
	buffer: ArrayBuffer | null;
	new_width: number;
	new_height: number;
	file_type: MimeType;
	objectURL: string;
}

export class Files {
	files: Archive[];
	processed: MaybeArchive[] = [];
	thumbs: string[] = [];
	id: number = Math.floor(Math.random() * 1e10);
	callback: (files: Archive[]) => void = () => {};
	jobs: Job[] = [];
	sorter: { [key: string]: number } = {};

	constructor(files: Archive[]) {
		console.debug("Init file processing");
		this.files = files;
		files.forEach((file, i) => {
			this.sorter[fileUniqueKey(file)] = i;
		});
	}

	addProcessedFile(file: MaybeArchive) {
		this.processed.push(file);
		Millchan.cmd(CMD.WRAPPER_PROGRESS, [
			this.id,
			`Processed ${this.processed.length}/${this.files.length}`,
			Math.floor(this.processed.length / this.files.length) * 100,
		]);
		store.dispatch(
			"setProgress",
			Math.round(100 * (this.processed.length / this.files.length))
		);
		if (file && file.thumb) {
			this.thumbs.push(file.thumb);
		}

		if (this.processed.length == this.files.length) {
			let files = <Archive[]>this.processed.filter((file) => file !== null);
			files.sort((f1, f2) => {
				return this.sorter[fileUniqueKey(f1)] - this.sorter[fileUniqueKey(f2)];
			});
			this.callback(files);
		}
	}

	process(): Promise<Archive[]> {
		return new Promise(async (resolve) => {
			if (this.files.length === 0) {
				resolve([]);
				return;
			}
			this.callback = resolve;
			Millchan.cmd(CMD.WRAPPER_NOTIFICATION, [
				"info",
				"Processing files...",
				config.notification_time,
			]);
			await this.processFiles();
			await this.resizeFiles();
			let resized_mimetype = config.allowed_image_mimetype.concat(
				config.allowed_video_mimetype
			);
			this.files.forEach((file) => {
				if (resized_mimetype.includes(file.type)) {
					return; // already processed in processFiles
				}
				if (config.allowed_mimetype.includes(file.type)) {
					let filename = uniqueFilename();
					file.original = `${filename}${config.mime2ext[file.type]}`;
					this.addProcessedFile(file);
				} else {
					if (file.type) {
						Millchan.error(
							`Ignoring file <b>${file.name}</b>: mimetype (${file.type}) not allowed`
						);
					} else {
						Millchan.error(
							`Ignoring file <b>${file.name}</b>: unknown mimetype`
						);
					}
					this.addProcessedFile(null);
				}
			});
		});
	}

	isHTMLImage(source: Source): source is HTMLImageElement {
		return (<HTMLImageElement>source).src !== undefined;
	}

	getImageURL(file: Source): Promise<ArrayBuffer | null> {
		return new Promise((resolve) => {
			const fileReader = new FileReader();
			fileReader.onload = () => {
				resolve(<ArrayBuffer>fileReader.result);
			};

			if (this.isHTMLImage(file)) {
				fetch(file.src)
					.then((response) => response.blob())
					.then((blob) => fileReader.readAsArrayBuffer(blob));
				return;
			}

			file.toBlob((blob) => {
				if (blob !== null) {
					fileReader.readAsArrayBuffer(blob);
				} else {
					resolve(null);
				}
			});
		});
	}

	processFiles() {
		return new Promise(async (resolve) => {
			for (let i = 0; i < this.files.length; i++) {
				const file = this.files[i];
				if (config.allowed_image_mimetype.includes(file.type)) {
					await this.createImage(file);
				} else if (config.allowed_video_mimetype.includes(file.type)) {
					await this.createVideo(file);
				}
			}
			resolve();
		});
	}

	resizeFiles() {
		return new Promise(async (resolve) => {
			if (this.jobs.length == 0) {
				resolve();
				return;
			}

			let workers_size = Math.min(config.max_resize_workers, this.jobs.length);
			const workers = [];
			while (workers_size--) {
				const worker = new Worker();
				// @ts-ignore
				worker.done = new Promise((resolve) => (worker.resolve = resolve));

				worker.onmessage = (event: MessageEvent) => {
					const b64data = event.data.b64data;
					const filename = uniqueFilename();
					const file = event.data.file;
					const file_type = event.data.file_type;
					const objectURL = event.data.objectURL;

					file.thumb = `${filename}-thumb${config.mime2ext[file_type]}`;
					file.original = `${filename}${config.mime2ext[file.type]}`;
					file.data = b64data;
					this.addProcessedFile(file);
					window.URL.revokeObjectURL(objectURL);

					const job = this.jobs.shift();
					if (job) {
						worker.postMessage({
							...job,
							thumbnail_quality: config.thumbnail_quality,
							jpegjs_max_memory: config.jpegjs_max_memory,
						});
					} else {
						worker.terminate();
						// @ts-ignore
						worker.resolve();
					}
				};

				const job = this.jobs.shift();
				if (job) {
					worker.postMessage({
						...job,
						thumbnail_quality: config.thumbnail_quality,
						jpegjs_max_memory: config.jpegjs_max_memory,
					});
				}
				workers.push(worker);
			}

			// @ts-ignore
			await Promise.all(workers.map((worker) => worker.done));
			resolve();
		});
	}

	createImage(file: Archive) {
		return new Promise((resolve) => {
			const img = new Image();
			img.addEventListener("progress", console.debug);
			img.onload = () => {
				if (file.type == MIME_WEBP) {
					const source = document.createElement("canvas");
					source.width = img.width;
					source.height = img.height;
					const ctx = source.getContext("2d");
					ctx?.drawImage(img, 0, 0, img.width, img.height);
					const jpegImage = new Image();
					jpegImage.onload = () => {
						this.onLoad(file, jpegImage, resolve, img.src);
					};
					jpegImage.src = source.toDataURL(MIME_JPEG, 1.0);
					return;
				}
				this.onLoad(file, img, resolve, img.src);
			};
			img.src = window.URL.createObjectURL(file);
		});
	}

	createVideo(file: Archive) {
		return new Promise((resolve) => {
			const source = document.createElement("canvas");
			const video = document.createElement("video");
			video.preload = "auto";
			video.addEventListener("error", () => {
				let filename = uniqueFilename();
				file.original = `${filename}${config.mime2ext[file.type]}`;
				this.addProcessedFile(file);
				resolve();
			});

			video.addEventListener("loadedmetadata", () => {
				video.currentTime = config.video_thumbnail_position * video.duration;
			});

			video.addEventListener("loadeddata", () => {
				source.width = video.videoWidth;
				source.height = video.videoHeight;
				const ctx = source.getContext("2d");
				ctx?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
				this.onLoad(file, source, resolve, video.src);
			});
			video.src = window.URL.createObjectURL(file);
		});
	}

	onLoad(
		file: Archive,
		source: Source,
		resolve: () => void,
		objectURL: string
	) {
		let new_width: number, new_height: number;
		if (
			source.width <= config.media_max_width &&
			source.height <= config.media_max_height
		) {
			new_width = source.width;
			new_height = source.height;
		} else {
			let scale = Math.min(
				config.media_max_width / source.width,
				config.media_max_height / source.height
			);
			new_width = source.width * scale;
			new_height = source.height * scale;
		}

		this.getImageURL(source).then((buffer) => {
			var file_type: MimeType;
			switch (file.type) {
				case MIME_JPEG:
					file_type = MIME_JPEG;
					break;
				default:
					file_type = MIME_PNG;
			}

			this.jobs.push({
				file,
				buffer,
				new_width,
				new_height,
				file_type,
				objectURL,
			});

			resolve();
		});
	}
}
