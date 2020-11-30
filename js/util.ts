import { Engine } from "millchan/millchan";
import { Config } from "millchan/config";
import { CMD } from "./ZeroFrame";
import { v4 as uuidv4 } from "uuid";
import "@babel/polyfill";
import "intersection-observer";
var parser = require("Parser").parser;

const sha1 = require("sha1");

declare const Millchan: Engine;
declare const config: Config;

export interface Post {
	id: string;
	uri: string;
	body: string;
	time: number;
	thread?: string;
	subject?: string;
	username?: string;
	directory: string;
	files?: string;
	last_edited?: number;
	capcode?: boolean;
}

export interface UserCertInfo {
	id: string;
	cert_user_id?: string;
}

export interface Thread extends Post {
	thread_no: number;
	replies: Post[];
	sticky: boolean;
}

export interface Board {
	uri: string;
	title: string;
	directory: string;
	description: string;
	json_id: number;
	config?: string;
}

export interface PopularBoard extends Board {
	total_posts: number;
}

export interface BlacklistedBoard extends Board {
	blacklisted: number;
}

export interface Archive extends File {
	name: string;
	thumb: string;
	size: number;
	type: string;
	original: string;
	directory: string;
	spoiler: boolean;
	data?: string;
}

export interface Modlog {
	uri: string;
	action: number;
	info: string;
	time?: number;
}

export interface JSONInfo {
	json_id: number;
	directory: string;
	file_name: string;
	cert_user_id: string;
}

export type MaybeError<T> = T | Error;

export const isError = (input: MaybeError<any>): input is Error => {
	return (<Error>input).error != undefined;
};

interface Error {
	error: string;
}

interface ParsedTime {
	value: number;
	type: string;
}

export type StringIntMap = { [key: string]: number };
export type IntStringMap = { [key: number]: string };
export type StringStringMap = { [key: string]: string };

export const parseDataUri = function (data: string): string[] {
	try {
		let regex = /^data:(image\/png|image\/jpeg|image\/jpg);base64,([\w\/=\+]+)$/,
			match = data.match(regex);
		if (match) {
			match.shift();
			return match;
		}
	} catch (error) {
		console.error(`Error in parseDataUri: ${error}`);
	}
	return [];
};

export const escape = function (input: string): string {
	return input
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
};

export const validate = function (posts: Post[]): Post[] {
	if (posts.length) {
		let now = Millchan.getZeroNetTime();
		posts.forEach((post) => (post.body = post.body ? post.body.trim() : ""));
		return posts.filter(
			(post) =>
				post.time <= now + config.delay_tolerance &&
				((<string>post.body).length || post.files !== "[]")
		);
	}
	return [];
};

export const lazyLoad = function (el: HTMLImageElement, inner_path: string) {
	el.setAttribute("lazy", "loading");
	el.setAttribute(
		"src",
		"data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
	);

	Millchan.cmd(
		CMD.OPTIONAL_FILE_INFO,
		{
			inner_path: inner_path,
		},
		(info) => {
			if (info && info.size > 1024 * 1024) {
				inner_path += "|all"; //Big file
			}
			loadFile(el, inner_path);
		}
	);
};

const loadFile = function (
	el: HTMLImageElement,
	inner_path: string,
	tries: number = 0
) {
	Millchan.cmd(
		CMD.FILE_GET,
		{
			inner_path: inner_path,
			required: true,
			format: "base64",
		},
		(b64data) => {
			if (b64data) {
				el.setAttribute("lazy", "loaded");
				// triggering reflow (Firefox workaround)
				void el.offsetWidth; // o_O
				el.setAttribute("src", "data:image/jpeg;base64," + b64data);
				return;
			}
			if (inner_path.endsWith("|all")) {
				loadFile(el, inner_path.split("|all")[0]);
				return;
			}
			if (tries == config.max_lazy_load_tries) {
				el.setAttribute("lazy", "error");
				el.classList.add("static");
				return;
			}
			loadFile(el, inner_path, ++tries);
		}
	);
};

export const encode = function (data: object): string {
	return btoa(
		unescape(encodeURIComponent(JSON.stringify(data, undefined, "\t")))
	);
};

export const bytes2Size = function (bytes: number): string {
	const lower = (1 << 10) - 1;
	let sizes = ["KiB", "MiB", "GiB"],
		size = `${bytes & lower}`;
	var unit = ["bytes"];
	while (bytes > 1024 && sizes.length) {
		bytes >>= 10;
		size = `${bytes & lower}.${parseInt(size)}`;
		unit = sizes.splice(0, 1);
	}
	return `${parseFloat(size).toFixed(2)} ${unit}`;
};

export const formatTime = function (time: Date): ParsedTime {
	let diff = (+new Date() - +new Date(time)) / 1000;
	return parseTime(diff);
};

export const parseTime = function (diff: number): ParsedTime {
	var value: number, type: string;
	if (diff < 60) [value, type] = [Math.floor(diff), "second"];
	else if (diff < 3600) [value, type] = [Math.floor(diff / 60), "minute"];
	else if (diff < 86400) [value, type] = [Math.floor(diff / 3600), "hour"];
	else [value, type] = [Math.floor(diff / 86400), "day"];
	return { value, type };
};

export const isSameFile = function (file1: File, file2: File): boolean {
	return fileUniqueKey(file1) === fileUniqueKey(file2);
};

export const fileUniqueKey = function (file: File) {
	return sha1(`${file.name}-${file.lastModified}-${file.size}-${file.type}`);
};

export const uniqueFilename = function (): string {
	return sha1(uuidv4());
};

export const fileInArray = function (new_file: File, array: File[]): boolean {
	array.forEach((file) => {
		if (isSameFile(file, new_file)) {
			return true;
		}
	});
	return false;
};

export const isOnScreen = function (element: HTMLElement) {
	let coors = element.getBoundingClientRect();
	return (
		coors.top >= 0 &&
		coors.top + element.clientHeight <= document.documentElement.clientHeight
	);
};

export const fetchAndSaveFile = function (download: string, href: string) {
	fetch(href)
		.then((data) => data.blob())
		.then((blob) => {
			const blobHref = URL.createObjectURL(blob);
			saveFile(download, blobHref);
			window.URL.revokeObjectURL(blobHref);
		});
};

export const saveFile = function (download: string, href: string) {
	let anchor = document.createElement("a");
	anchor.href = href;
	anchor.download = download;
	document.body.appendChild(anchor);
	anchor.click();
	document.body.removeChild(anchor);
};

export const optionalValue = function (id: string): string | undefined {
	let element = document.getElementById(id);
	if (element) {
		return (<HTMLInputElement>element).value;
	}
	return undefined;
};

export const requiredValue = function (id: string): string {
	let element = document.getElementById(id);
	if (element) {
		return (<HTMLInputElement>element).value;
	}
	throw `required id not found: ${id}`;
};

const formats = [
	(str: string) =>
		str.replace(
			/^(&gt;(?!&gt;\w{8}-\w{4}-\w{4}-\w{4}-\w{12}).*)/gm,
			"<span class='implying'>$1</span>"
		), //Quote
	(str: string) =>
		str.replace(/(?:^- ?.+\s?)+/gm, (list) => {
			return `<ul>${list.replace(/^- ?(.+\s?)/gm, "<li> $1</li>")}</ul>`; //List
		}),
];

export const formatter = (
	body: string,
	max_body_length = config.max_body_length
) => {
	if (body) {
		let escaped = escape(body);
		formats.forEach((format) => {
			escaped = format(escaped);
		});
		try {
			escaped = parser.parse(escaped);
		} catch (e) {
			console.warn(`parse error ${e}`);
		}
		escaped = escaped.replace(/\n/g, "<br>");
		return escaped.slice(0, max_body_length);
	}
	return "";
};
