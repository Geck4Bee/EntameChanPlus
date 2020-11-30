import { validate } from "Util";
// @ts-ignore
import store from "store";
import { Config } from "./config";
import { Engine } from "./millchan";
import { IntStringMap } from "Util";
import { Post, Thread, isError } from "Util";
import {
	Board,
	BlacklistedBoard,
	PopularBoard,
	Modlog,
	JSONInfo,
	Archive,
	UserCertInfo,
} from "Util";
import { CMD } from "../ZeroFrame";

declare const Millchan: Engine;
declare const config: Config;

export class Database {
	static blacklistFilter() {
		return `
			AND p.directory || ':' || p.uri || ':' || j.directory NOT IN (
				SELECT json.directory || ':' || modlogs.uri || ':' || modlogs.info
				FROM modlogs INNER JOIN json USING(json_id)
				WHERE action=${config.action.BL_USER}
			)`;
	}

	static getRecentPosts(blacklisted_boards: string[] = [], limit: number) {
		return new Promise((resolve, reject) => {
			const query = `
				SELECT * FROM posts p
				INNER JOIN json j USING(json_id)
				WHERE (LENGTH(TRIM(body)) > 0 OR files <> '[]')
				${Database.blacklistFilter()}
				AND p.directory || ':' || p.uri NOT IN ("${blacklisted_boards.join('","')}")
				ORDER BY time DESC
				LIMIT ${config.max_recent_posts}`;
			Millchan.cmd(CMD.DB_QUERY, [query], (posts: Post[]) => {
				if (isError(posts)) {
					reject(`Error fetching recent posts from database: ${posts.error}`);
					return;
				}
				posts = validate(posts).splice(0, limit);
				resolve(posts);
			});
		});
	}

	static getRecentPinnedPosts(pinned_boards: string[], limit: number) {
		return new Promise((resolve, reject) => {
			let boards = pinned_boards.join("','");
			const query = `
				SELECT *
				FROM posts p
				INNER JOIN json j USING(json_id)
				WHERE p.directory || ':' || uri IN ('${boards}')
				AND (LENGTH(TRIM(p.body)) > 0 OR p.files <> '[]')
				${Database.blacklistFilter()}
				ORDER BY p.time DESC
				LIMIT ${config.max_recent_posts}
			`;
			Millchan.cmd(CMD.DB_QUERY, [query], (posts: Post[]) => {
				if (isError(posts)) {
					reject(
						`Error fetching recent pinned posts from database: ${posts.error}`
					);
					return;
				}
				posts = validate(posts).splice(0, limit);
				resolve(posts);
			});
		});
	}

	static getAllBoardFiles(directory: string, uri: string) {
		return new Promise<string[]>((resolve, reject) => {
			Millchan.cmd(
				CMD.DB_QUERY,
				[
					`SELECT posts.files, json.directory
					FROM posts
					INNER JOIN json USING(json_id)
					WHERE posts.directory = '${directory}'
					AND posts.uri='${uri}'
					AND posts.files <> '[]'
					`,
				],
				(posts: Post[]) => {
					if (isError(posts)) {
						reject(`Error while fetching posts from database ${posts.error}`);
						return;
					}
					let boardFiles: string[] = [];
					posts.forEach((post) => {
						if (post.files) {
							JSON.parse(post.files).forEach((file: Archive) => {
								if (
									config.media_source_regex.test(
										`data/${post.directory}/src/${file.original}`
									)
								)
									boardFiles.push(
										`data/${post.directory}/src/${file.original}`
									);
								if (
									file.thumb &&
									config.image_src_regex.test(
										`data/${post.directory}/${file.thumb}`
									)
								)
									boardFiles.push(`data/${post.directory}/${file.thumb}`);
							});
						}
					});
					resolve(boardFiles);
				}
			);
		});
	}

	static getPost(post_id: string): Promise<Post | null> {
		return new Promise((resolve, reject) => {
			Millchan.cmd(
				CMD.DB_QUERY,
				[`SELECT * FROM posts WHERE id = '${post_id}' LIMIT 1`],
				(posts: Post[]) => {
					if (isError(posts)) {
						reject(`Error while fetching post from database: ${posts.error}`);
						return;
					}
					posts = validate(posts);
					if (posts.length > 0) {
						resolve(posts[0]);
					} else {
						resolve(null);
					}
				}
			);
		});
	}

	static getThread({
		thread: thread_id,
		limit = 0,
	}: {
		thread: string;
		limit: number;
	}) {
		return new Promise((resolve, reject) => {
			Millchan.cmd(
				CMD.DB_QUERY,
				[`SELECT * FROM posts WHERE id = '${thread_id}'`],
				(thread: Post[]) => {
					if (isError(thread)) {
						reject(
							`Error while fetching thread ${thread_id} from the database: ${thread.error}`
						);
						return;
					}
					thread = validate(thread);
					Millchan.cmd(
						CMD.DB_QUERY,
						[`SELECT * FROM posts WHERE thread = '${thread_id}' ORDER BY time`],
						(replies: Post[]) => {
							if (isError(replies)) {
								reject(
									`Error while fetching replies from database: ${replies.error}`
								);
								return;
							}
							replies = validate(replies);
							store.dispatch("setThreadTitle", {
								thread: thread[0],
								replies_count: replies.length,
							});
							if (limit > 0) {
								replies = replies.slice(-limit);
							}
							resolve(thread.concat(replies));
						}
					);
				}
			);
		});
	}

	static getUserBoards(address: string) {
		return new Promise((resolve, reject) => {
			Millchan.cmd(
				CMD.DB_QUERY,
				[
					`SELECT DISTINCT uri,directory,title FROM boards
					JOIN json ON boards.json_id = json.json_id
					WHERE directory = 'users/${address}'`,
				],
				(boards: Board[]) => {
					if (isError(boards)) {
						reject(boards.error);
						return;
					}
					if (boards.length) {
						resolve(boards);
					}
				}
			);
		});
	}

	static popularBoards(): Promise<PopularBoard[]> {
		return new Promise((resolve, reject) => {
			const query = `
				SELECT * FROM (
					SELECT b.uri,b.directory,b.title,b.description,COUNT(p.id) as total_posts,b.json_id
					FROM (SELECT * FROM boards JOIN json USING(json_id)) as b
					LEFT JOIN posts as p
					ON b.uri = p.uri AND p.directory = b.directory
					WHERE (LENGTH(TRIM(p.body)) > 0 OR p.files <> '[]')
					GROUP BY b.uri,b.json_id
				) UNION
				SELECT uri,directory,null,null,COUNT(*) as total_posts,null FROM posts
				WHERE uri NOT IN (
					SELECT uri FROM boards
				) AND (LENGTH(TRIM(body)) > 0 OR files <> '[]')
				GROUP BY directory,uri`;
			Millchan.cmd(CMD.DB_QUERY, [query], (boards: PopularBoard[]) => {
				if (isError(boards)) {
					reject(boards.error);
					return;
				}
				resolve(boards);
			});
		});
	}

	static blacklistBoards(): Promise<BlacklistedBoard[]> {
		return new Promise((resolve, reject) => {
			const query = `
					SELECT directory, uri, SUM(blposts) blacklisted FROM (
						SELECT directory, uri, COUNT(info) blposts
						FROM modlogs ml
						INNER JOIN json j USING (json_id)
						WHERE ml.action=${config.action.BL_POST}
						GROUP BY uri, directory
						UNION
						SELECT j1.directory, ml.uri, COUNT(p.id) blposts
						FROM modlogs ml
						INNER JOIN json j1 ON ml.json_id = j1.json_id
						INNER JOIN json j2 ON ml.info = j2.directory
						INNER JOIN posts p ON p.json_id = j2.json_id AND p.uri = ml.uri AND p.directory = j1.directory
						WHERE ml.action=${config.action.BL_USER}
						GROUP BY ml.uri, j1.directory
					) GROUP BY directory, uri
					`;
			Millchan.cmd(CMD.DB_QUERY, [query], (blposts: BlacklistedBoard[]) => {
				if (isError(blposts)) {
					reject(blposts.error);
					return;
				}
				resolve(blposts);
			});
		});
	}

	static getPopularBoards() {
		return new Promise((resolve) => {
			Promise.all([Database.popularBoards(), Database.blacklistBoards()]).then(
				([boards, blposts]) => {
					let blacklisted = blposts.reduce((acc, board) => {
						acc[`${board.directory}-${board.uri}`] = board.blacklisted;
						return acc;
					}, <{ [key: string]: number }>{});
					boards.forEach((board) => {
						let boardKey = `${board.directory}-${board.uri}`;
						if (boardKey in blacklisted) {
							board.total_posts -= blacklisted[boardKey];
						}
					});
					boards.sort(function (b1, b2) {
						return b2.total_posts - b1.total_posts;
					});
					resolve(boards);
				}
			);
		});
	}

	static getAllThreads({ directory, uri }: Board) {
		return new Promise((resolve, reject) => {
			//Long query to keep bump order
			let query = `
				SELECT *,time as last_time FROM posts
				WHERE thread is NULL
				AND directory = '${directory}'
				AND uri = '${uri}'
				AND id NOT IN (
					SELECT thread.id FROM posts as thread
					JOIN posts as reply ON thread.id = reply.thread
				) UNION
				SELECT thread.*,MAX(reply.time) as last_time FROM posts as thread
				JOIN posts as reply ON thread.id = reply.thread
				WHERE thread.directory = '${directory}'
				AND reply.directory = '${directory}'
				AND reply.uri = '${uri}'
				GROUP BY thread.id
				ORDER BY last_time DESC
			`;
			Millchan.cmd(CMD.DB_QUERY, [query], (threads: Thread[]) => {
				if (isError(threads)) {
					reject(`No threads returned from database query: ${threads.error}`);
					return;
				}
				threads = <Thread[]>(
					validate(threads).slice(0, config.max_pages * config.threads_per_page)
				);
				if (threads.length) {
					Millchan.cmd(
						CMD.DB_QUERY,
						[`SELECT info FROM modlogs WHERE action = ${config.action.STICK}`],
						(stickies: { info: string }[]) => {
							if (isError(stickies)) {
								reject(
									`Error while fetching stickies from database: ${stickies.error}`
								);
								return;
							}
							if (stickies.length) {
								let stick_ids = stickies.map((e) => e.info),
									stick_threads: Thread[] = [],
									normal_threads: Thread[] = [];
								threads.forEach((thread) => {
									if (stick_ids.includes(thread.id)) {
										thread.sticky = true;
										stick_threads.push(thread);
									} else {
										normal_threads.push(thread);
									}
								});
								threads = stick_threads.concat(normal_threads);
							}
							resolve(threads);
						}
					);
				}
			});
		});
	}

	static getThreadsReplies(threads: Thread[], { directory, uri }: Thread) {
		return new Promise((resolve, reject) => {
			let thread_ids = threads.map((e) => `'${e.id}'`).join(",");
			Millchan.cmd(
				CMD.DB_QUERY,
				[
					`SELECT * FROM posts
					WHERE thread IN (${thread_ids})
					AND directory = '${directory}'
					AND uri = '${uri}'
					ORDER BY time`,
				],
				(replies: Post[]) => {
					if (isError(replies)) {
						reject(`Error while fetching thread replies: ${replies.error}`);
						return;
					}
					replies = validate(replies);
					if (replies.length) {
						let thread_by_id: { [key: string]: Thread } = {};
						threads.forEach((thread) => {
							thread_by_id[thread.id] = thread;
						});
						replies.forEach((reply) => {
							if (reply.thread && reply.thread in thread_by_id) {
								if (!thread_by_id[reply.thread].replies) {
									thread_by_id[reply.thread].replies = [];
								}
								thread_by_id[reply.thread].replies.push(reply);
							}
						});
					}
					resolve(threads);
				}
			);
		});
	}

	static getBoardInfo({ directory, uri }: Board) {
		return new Promise((resolve, reject) => {
			Millchan.cmd(
				CMD.DB_QUERY,
				[
					`SELECT * FROM boards
					JOIN json ON boards.json_id = json.json_id
					WHERE directory = '${directory}'
					AND uri = '${uri}'`,
				],
				(boardinfo: Modlog[]) => {
					if (isError(boardinfo)) {
						reject(
							`Error while fetching board info from database: ${boardinfo.error}`
						);
						return;
					}
					resolve(boardinfo.length == 1 ? boardinfo[0] : { uri });
				}
			);
		});
	}

	static getBlacklist({ directory, uri }: Post) {
		return new Promise((resolve, reject) => {
			Promise.all([
				Millchan.cmdp(CMD.DB_QUERY, [
					`SELECT json_id, ml.info info, ml.time time, '${uri}' uri,'${directory}' directory FROM json
					JOIN (
						SELECT time, info
						FROM modlogs
						JOIN json ON modlogs.json_id = json.json_id
						WHERE directory='${directory}'
						AND action=${config.action.BL_USER}
						AND uri='${uri}'
					) as ml ON json.directory = ml.info
					ORDER BY time DESC
					`,
				]),
				Millchan.cmdp(CMD.DB_QUERY, [
					`SELECT * FROM modlogs
					JOIN json ON modlogs.json_id = json.json_id
					WHERE directory='${directory}'
					AND uri='${uri}'
					AND action=${config.action.BL_POST}
					ORDER BY time DESC`,
				]),
			])
				.then((result) => {
					resolve(result);
				})
				.catch((err) => {
					reject(err);
				});
		});
	}

	static getJsonID({ auth_address }: { auth_address: string }) {
		return new Promise((resolve, reject) => {
			Millchan.cmd(
				CMD.DB_QUERY,
				[
					`SELECT json_id FROM json
					WHERE directory = 'users/${auth_address}'
					LIMIT 1`,
				],
				(json_id: { json_id: number }[]) => {
					if (isError(json_id)) {
						reject(json_id.error);
						return;
					}
					if (json_id.length) {
						resolve(json_id[0].json_id);
					}
				}
			);
		});
	}

	static getUserDirs() {
		return new Promise((resolve, reject) => {
			const query = "SELECT directory,json_id FROM json";
			Millchan.cmd(CMD.DB_QUERY, [query], (data: JSONInfo[]) => {
				if (isError(data)) {
					reject("Error while fetching directories from database");
					return;
				}
				if (data.length) {
					let user_dirs = data.reduce((acc, dir) => {
						acc[dir.json_id] = dir.directory;
						return acc;
					}, <IntStringMap>{});
					resolve(user_dirs);
				}
			});
		});
	}

	static getAllBoardPosts({ directory, uri }: Post): Promise<Post[]> {
		return new Promise((resolve, reject) => {
			Millchan.cmd(
				CMD.DB_QUERY,
				[
					`SELECT * FROM posts
					WHERE directory = '${directory}'
					AND uri='${uri}'`,
				],
				(posts: Post[]) => {
					if (isError(posts)) {
						reject(`Error while fetching posts from database: ${posts.error}`);
						return;
					}
					posts = validate(posts);
					if (posts.length) {
						resolve(posts);
					} else {
						resolve([]);
					}
				}
			);
		});
	}

	static searchPosts(
		body?: string,
		fileFilter?: string,
		subjectFilter?: string,
		userFilter?: string,
		boardFilter?: string
	) {
		return new Promise((resolve, reject) => {
			let filters: string[] = [];
			[
				[body, `body LIKE "%:field:%"`],
				[fileFilter, `files LIKE "%:field:%"`],
				[subjectFilter, `subject LIKE "%:field:%"`],
				[userFilter, `(username = ":field:" OR cert_user_id LIKE ":field:%")`],
				[boardFilter, `uri = ":field:"`],
			].forEach(([field, filter]) => {
				if (field && filter) {
					field = field.replace(/"/g, `""`);
					field = field.replace(/\+/g, " ");

					filter = filter.replace(/:field:/g, field);
					filters.push(filter);
				}
			});

			if (filters.length == 0) {
				resolve([]);
				return;
			}

			let filter = filters.join(" AND ");
			let query = `SELECT * FROM posts INNER JOIN json USING(json_id)
						WHERE ${filter}
						ORDER BY time DESC LIMIT 100`;

			Millchan.cmd(CMD.DB_QUERY, [query], (posts: Post[]) => {
				if (isError(posts)) {
					reject(`Error while fetching posts from database ${posts.error}`);
					return;
				}
				posts = validate(posts);
				if (posts.length) {
					resolve(posts);
				} else {
					resolve([]);
				}
			});
		});
	}

	static getUserCertIDs({
		directory: dir,
		uri,
	}: Board): Promise<{ [id: string]: string }> {
		return new Promise((resolve, reject) => {
			let query = `
				SELECT p.id, j.cert_user_id cert_user_id
				FROM posts p
				INNER JOIN json j USING(json_id)
			`;
			query +=
				dir && uri ? ` WHERE p.directory='${dir}' AND p.uri='${uri}'` : ``;

			Millchan.cmd(CMD.DB_QUERY, [query], (certs: UserCertInfo[]) => {
				if (isError(certs)) {
					reject(`Error while fetching certs from database: ${certs.error}`);
					return;
				}
				if (certs.length) {
					let cert_ids = certs.reduce((acc, cert) => {
						if (cert.cert_user_id) acc[cert.id] = cert.cert_user_id;
						return acc;
					}, <{ [id: string]: string }>{});
					resolve(cert_ids);
				}
			});
		});
	}
}
