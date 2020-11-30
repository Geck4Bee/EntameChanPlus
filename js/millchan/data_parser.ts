import { encode } from "Util";
import { Post, Board, Modlog, Archive } from "Util";
import { Config } from "./config";
import { Engine } from "./millchan";

declare const config: Config;
declare const Millchan: Engine;

interface Data {
	posts: Post[];
	boards: Board[];
	modlogs: Modlog[];
}

export class DataParser {
	data: Data;

	constructor(data: string) {
		this.data = data
			? JSON.parse(data)
			: {
					posts: [],
					boards: [],
					modlogs: [],
			  };
	}

	encodedData(): string {
		return encode(this.data);
	}

	newBoard(uri: string, title: string): string {
		this.data.boards.forEach((board) => {
			if (board.uri === uri) {
				throw "Board already exists";
			}
		});

		if (!config.board_uri_regex.test(uri)) {
			throw "Board name should be less than 30 characters and contain only alphanumeric characters";
		}

		let new_board = {
			uri: uri,
			title: title,
		};
		this.data.boards.push(<Board>new_board);
		return this.encodedData();
	}

	cite2ID(post: Post, board_posts: Post[]): string {
		let body = "";
		if (post.body) {
			let cite_regex = />>(\w{8})/g;
			let ids_by_short_id = board_posts.reduce((acc, post) => {
				let short_id = post.id.split("-")[0];
				if (!(short_id in acc)) acc[short_id] = post.id;
				return acc;
			}, <{ [key: string]: string }>{});
			body = post.body.replace(cite_regex, (_, cite) => {
				if (ids_by_short_id[cite]) return `>>${ids_by_short_id[cite]}`;
				return `>>${cite}`;
			});
		}
		return body;
	}

	getEncodedFiles(files: Archive[]): string {
		return JSON.stringify(
			files.map((file) => {
				return {
					name: file.name,
					thumb: file.thumb,
					size: file.size,
					type: file.type,
					original: file.original,
					directory: file.directory,
					spoiler: file.spoiler,
				};
			})
		);
	}

	newPost(post: Post, files: Archive[], board_posts: Post[]): string {
		if (!post.id) {
			throw "Post id is required";
		}
		let new_post = [
			["id", post.id],
			["directory", post.directory],
			["uri", post.uri],
			["thread", post.thread],
			["subject", post.subject],
			["username", post.username],
			["capcode", post.capcode],
			["body", this.cite2ID(post, board_posts)],
			["time", post.time],
			["files", this.getEncodedFiles(files)],
		].reduce((acc, [key, value]) => {
			if (value) acc[<string>key] = value;
			return acc;
		}, <{ [key: string]: any }>{});
		this.data.posts.push(<Post>new_post);
		return this.encodedData();
	}

	editPost(post: Post, board_posts: Post[]): string {
		this.data.posts.some((old_post) => {
			if (old_post.id === post.id) {
				old_post.body = this.cite2ID(post, board_posts);
				old_post.last_edited = Millchan.getZeroNetTime();
				old_post.subject = post.subject;
				old_post.capcode = post.capcode;
				return true;
			}
		});
		return this.encodedData();
	}

	deletePost(post: Post): string {
		this.data.posts = this.data.posts.filter(
			(old_post) => old_post.id !== post.id
		);
		return this.encodedData();
	}

	editBoard(board: Board): string {
		this.data.boards.some((old_board) => {
			if (old_board.uri === board.uri) {
				old_board.title = board.title;
				old_board.config = board.config;
				old_board.description = board.description;
				return true;
			}
		});
		return this.encodedData();
	}

	newAction(action: Modlog): string {
		let new_data = {
			uri: action.uri,
			action: action.action,
			info: action.info,
			time: Millchan.getZeroNetTime(),
		};
		this.data.modlogs.push(<Modlog>new_data);
		return this.encodedData();
	}

	delAction(action: Modlog): string {
		let new_modlog: Modlog[] = [];
		this.data.modlogs.forEach((modlog) => {
			if (
				modlog.info === action.info &&
				modlog.uri === action.uri &&
				modlog.action === action.action
			) {
				return;
			}
			new_modlog.push(modlog);
		});
		this.data.modlogs = new_modlog;
		return this.encodedData();
	}
}
