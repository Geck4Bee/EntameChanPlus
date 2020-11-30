import { CMD, Message, ZeroFrame, Callback, Params } from "../ZeroFrame";
import { DataParser } from "./data_parser";
import { Database } from "./database";
import { Files } from "./files";
import { Thumbnails } from "./thumbs";
import { Board, Archive, Post } from "Util";
import { encode, optionalValue, requiredValue } from "Util";
// @ts-ignore
import store from "store";
import { Viewer } from "./viewer";
import { Config } from "./config";
import { v4 as uuidv4 } from "uuid";

const debounce = require("lodash.debounce");

declare const viewer: Viewer;
declare const config: Config;
// @ts-ignore
const bitcoinJSMSG = () => import("bitcoinjs-message");
// @ts-ignore
const bitcoinJS = () => import("bitcoinjs-lib");

interface LocalStorage {
	config?: { [key: string]: any };
	style?: string;
	username?: string;
	pinned?: string[];
	watched_threads?: string[];
	popular_boards?: { [key: string]: any };
	hidden_threads?: string[];
}

export class Engine extends ZeroFrame {
	routes: { [route: string]: (match: string[], storage: any) => void } = {};
	active_page: string = "home";
	siteInfo: Params = {};
	serverInfo: Params = {};
	inner_path: string = "";
	settings_path: string = "";
	blacklist_path: string = "";
	username?: string;
	progress: number = 0;

	constructor() {
		super();
		this.routes["home"] = (match, local_storage) => {
			this.active_page = "home";
			let payload = {
				active_page: this.active_page,
				pinned: local_storage["pinned"],
				auth_address: this.siteInfo.auth_address,
			};
			store.dispatch("renderHome", payload);
		};
		this.routes["board"] = (match) => {
			let [directory, uri] = match;
			window.location.href = `${window.location.pathname}/?:${directory}:${uri}:0`;
		};
		this.routes["thread"] = (match, local_storage) => {
			this.active_page = "thread";
			let [directory, uri, thread, limit] = match;
			let payload = {
				active_page: this.active_page,
				auth_address: this.siteInfo.auth_address,
				is_user_board: directory.split("/")[1] == this.siteInfo.auth_address,
				is_blacklist_active: local_storage[`blacklist:${directory}:${uri}`],
				directory,
				uri,
				thread,
				limit,
			};
			store.dispatch("renderThread", payload);
		};
		this.routes["page"] = (match, local_storage) => {
			this.active_page = "page";
			let [directory, uri, page] = match;
			let payload = {
				active_page: this.active_page,
				auth_address: this.siteInfo.auth_address,
				is_user_board: directory.split("/")[1] == this.siteInfo.auth_address,
				is_blacklist_active: local_storage[`blacklist:${directory}:${uri}`],
				directory,
				uri,
				page,
			};
			store.dispatch("renderPage", payload);
		};
		this.routes["catalog"] = (match, local_storage) => {
			this.active_page = "catalog";
			let [directory, uri] = match;
			let payload = {
				active_page: this.active_page,
				is_user_board: directory.split("/")[1] == this.siteInfo.auth_address,
				is_blacklist_active: local_storage[`blacklist:${directory}:${uri}`],
				directory,
				uri,
			};
			store.dispatch("renderCatalog", payload);
		};
		this.routes["edit"] = (match) => {
			this.active_page = "edit";
			let [directory, uri] = match;
			let payload = {
				active_page: this.active_page,
				directory,
				uri,
			};
			store.dispatch("renderEdit", payload);
		};
		this.routes["blacklist"] = (match) => {
			this.active_page = "blacklist";
			let [directory, uri] = match;
			let payload = {
				active_page: this.active_page,
				directory,
				uri,
			};
			store.dispatch("renderBlacklist", payload);
		};
		this.routes["search"] = () => {
			this.active_page = "search";
			let payload = {
				active_page: this.active_page,
			};
			store.dispatch("renderSearch", payload);
		};
		//receive updates on the serverInfo(time correction)
		this.cmd(CMD.CHANNEL_JOIN, ["serverChanged"]);
	}
	// translation helper
	$t(string: string) {
		return viewer.vm.$t(string);
	}

	error(message: string) {
		this.cmd(CMD.WRAPPER_NOTIFICATION, [
			"error",
			message,
			config.notification_time,
		]);
	}

	onOpenWebsocket() {
		console.debug("Websocket opened");
		Promise.all([
			this.cmdp<Params>(CMD.SERVER_INFO, {}),
			this.cmdp<Params>(CMD.SITE_INFO, {}),
		]).then(([serverInfo, siteInfo]) => {
			this.serverInfo = serverInfo ? serverInfo : {};
			this.siteInfo = siteInfo ? siteInfo : {};
			this.inner_path = `data/users/${siteInfo.auth_address}/data.json`;
			this.settings_path = `data/users/${siteInfo.auth_address}/settings.json`;
			this.blacklist_path = `data/users/${siteInfo.auth_address}/blacklist.json`;
			this.removeDownloads();
			this.checkCert(false);
			this.urlRoute();
			this.isTorEnabled();
		});
	}

	onRequest(cmd: CMD, message: Message) {
		console.debug("New request");
		if (cmd === "setSiteInfo") {
			this.onSiteInfoChanged(message.params);
		} else if (cmd == "setServerInfo") {
			this.onServerInfoChanged(message.params);
		}
	}

	removeDownloads(): Promise<unknown> {
		return new Promise((resolve) => {
			this.cmd(
				CMD.FILE_LIST,
				{ inner_path: `/data/users/${this.siteInfo.auth_address}/download` },
				(filelist: string[]) => {
					filelist.forEach((file) => {
						this.cmd(CMD.FILE_DELETE, [
							`/data/users/${this.siteInfo.auth_address}/download/${file}`,
						]);
					});
					resolve();
				}
			);
		});
	}

	onSiteInfoChanged(newInfo: { [key: string]: any } | undefined) {
		if (newInfo && newInfo.event && newInfo.event[0] == "file_done") {
			let match =
				typeof newInfo.event[1] == "string"
					? newInfo.event[1].match(config.user_data_regex)
					: null;
			if (match || this.active_page == "home") {
				this.urlRoute();
			}
		}
		//update local siteInfo object
		if (newInfo) {
			Object.keys(newInfo).forEach((key) => {
				if (newInfo) this.siteInfo[key] = newInfo[key];
			});
			this.checkCert(false);
		}
	}

	onServerInfoChanged = debounce(
		(newInfo: { [key: string]: any }) => {
			//update local serverInfo object
			if (newInfo) {
				Object.keys(newInfo).forEach((key) => {
					if (newInfo) this.serverInfo[key] = newInfo[key];
				});
			}
			this.isTorEnabled();
		},
		config.info_update_debounce_time,
		{ maxWait: config.max_time_between_server_info_updates, trailing: true }
	);

	onPopState(state: HTMLAnchorElement) {
		this.urlRoute(state.href);
	}

	isTorEnabled() {
		store.dispatch("setTorEnabled", this.serverInfo.tor_enabled);
	}

	matchRoute(url: string): [RegExpMatchArray, string | RegExp] {
		var matched_url: RegExpMatchArray | undefined,
			matched_page: string | RegExp | undefined;
		config.routes.some(([regex, page]) => {
			let match = url.match(regex);
			if (match) {
				match.shift();
				[matched_url, matched_page] = [match, page];
				return true;
			}
		});
		if (matched_url === undefined || matched_page === undefined) {
			throw `undefined route: ${url}`;
		}
		return [matched_url, matched_page];
	}

	publishUpdate(publishArgs = { inner_path: this.inner_path }) {
		return new Promise(async (resolve) => {
			console.debug("Removing downloads");
			await this.removeDownloads();
			console.debug("Publishing update");
			this.cmd(CMD.SITE_PUBLISH, publishArgs, resolve);
		});
	}

	urlRoute = debounce(
		async (url: string | null = null) => {
			console.debug("Reloading route...");
			let [local_storage] = await Promise.all<LocalStorage, unknown>([
				this.getLocalStorage(),
				this.getLocalBlacklist(),
			]);
			store.dispatch("setLocalStorage", local_storage);
			config.update(<Config>local_storage.config);
			if (url) {
				this.route(local_storage, new URL(url));
				return;
			}
			this.cmd(
				CMD.WRAPPER_GET_STATE,
				{},
				(state: { [search: string]: string }) => {
					let url = new URL(window.location.href);
					if (state) {
						// if current state is empty default to home
						url.search = "";
						if (state.search) {
							if (state.search.includes("#")) {
								[url.search, url.hash] = state.search.split("#");
								store.commit("setURLHash", url.hash);
							} else {
								url.search = state.search;
							}
						}
					}
					this.route(local_storage, url);
				}
			);
		},
		config.info_update_debounce_time,
		{ maxWait: config.max_time_between_server_info_updates, leading: true }
	);

	route(local_storage: LocalStorage, url: URL) {
		let routeURL = url.search.replace(/[&?]wrapper_nonce=[A-Za-z0-9]+/, "");
		let [match, route] = this.matchRoute(routeURL);
		if (typeof route === "string" && route in this.routes) {
			this.routes[route](match, local_storage);
		} else {
			if (config.noroute_redirect) {
				window.location.href = window.location.pathname;
			} else {
				this.error(`Error: Unknown route ${url}`);
			}
		}
	}

	async getLocalStorage(): Promise<LocalStorage> {
		let local_storage = await this.getLocalSettings();
		return new Promise((resolve) => {
			// Pins
			if (!("pinned" in local_storage)) {
				local_storage["pinned"] = [];
			}

			// Popular boards
			if (!("popular_boards" in local_storage)) {
				local_storage["popular_boards"] = {};
			}

			// Watched thread
			if (!("watched_threads" in local_storage)) {
				local_storage["watched_threads"] = [];
			}

			// Hidden threads
			if (!("hidden_threads" in local_storage)) {
				local_storage["hidden_threads"] = [];
			}

			// CSS
			if (
				"style" in local_storage &&
				local_storage["style"] &&
				config.styles.includes(local_storage["style"])
			) {
				for (let i = 0; i < window.document.styleSheets.length; i++) {
					let style = window.document.styleSheets[i];
					if (
						!style.href ||
						style.href.split("/").includes(local_storage["style"])
					) {
						style.disabled = false;
					} else if (
						!config.enabled_themes.includes(style.href.split("/")[5])
					) {
						style.disabled = true;
					}
				}
			} else {
				for (let i = 0; i < window.document.styleSheets.length; i++) {
					let style = window.document.styleSheets[i];
					if (
						!style.href ||
						config.enabled_themes.includes(style.href.split("/")[5]) ||
						style.href.split("/").includes(config.default_theme)
					) {
						style.disabled = false;
					} else {
						style.disabled = true;
					}
				}
				local_storage["style"] = config.default_theme;
				this.setLocalSettings(local_storage);
			}
			store.dispatch("setDarkTheme", local_storage["style"]);

			// Config
			if (!("config" in local_storage)) {
				local_storage["config"] = {};
			}
			this.username = local_storage["username"];
			store.dispatch("setUsername", this.username);
			let default_config = {};
			if (local_storage["config"]) {
				default_config = config.userConfig(local_storage["config"]);
				if (
					Object.keys(local_storage["config"]).length !==
					Object.keys(default_config).length
				) {
					local_storage["config"] = default_config;
					this.setLocalSettings(local_storage);
				}
			}

			store.dispatch("setWatchedThreads", local_storage["watched_threads"]);
			resolve(local_storage);
		});
	}

	getLocalSettings(): Promise<LocalStorage> {
		return this.cmdp<LocalStorage>(CMD.USER_GET_SETTINGS, {});
	}

	setLocalSettings(settings: LocalStorage, cb: Callback = null) {
		this.cmd(CMD.USER_SET_SETTINGS, { settings: settings }, cb);
	}

	//time stuff
	getZeroNetTime(): number {
		//in ms
		//for tracking protection reasons the last 2 digits are set to 0 (time precision is +/- 100 ms) in TBB
		//so people from other browsers need to toss that precision as well
		let now = Math.round(Date.now() / 100) * 100;
		return new Date(Math.round(now + this.getTimeCorrection())).getTime();
	}

	getTimeCorrection() {
		// in ms
		if (this.serverInfo.timecorrection)
			return this.serverInfo.timecorrection * 1000;
		//serverInfo.timecorrection is in seconds, but we need ms
		return 0;
	}

	getLocalBlacklist() {
		return new Promise((resolve) => {
			if (!config.inner_path_regex.test(this.blacklist_path)) {
				resolve();
				return;
			}
			this.cmd(
				CMD.FILE_GET,
				{ inner_path: this.blacklist_path, required: false },
				(data) => {
					if (data) {
						store.dispatch("setLocalBlacklist", JSON.parse(data));
					} else if (data == null) {
						let local_blacklist = {
							boards: [],
						};
						this.setLocalBlacklist(local_blacklist, false);
					}
					resolve();
				}
			);
		});
	}

	setLocalBlacklist(blacklist: object, notify = true) {
		this.cmd(
			CMD.FILE_WRITE,
			[this.blacklist_path, encode(blacklist)],
			(res) => {
				if (res === "ok") {
					if (notify) {
						this.cmd(CMD.WRAPPER_NOTIFICATION, [
							"done",
							"Board blacklisted!",
							config.notification_time,
						]);
					}
					this.urlRoute();
				} else {
					this.error(res.error);
				}
			}
		);
	}

	unpinBoard(directory: string, uri: string) {
		this.changePin(directory, uri, CMD.OPTIONAL_FILE_UNPIN);
	}

	pinBoard(directory: string, uri: string) {
		this.changePin(directory, uri, CMD.OPTIONAL_FILE_PIN);
	}

	changePin(
		directory: string,
		uri: string,
		action: CMD.OPTIONAL_FILE_PIN | CMD.OPTIONAL_FILE_UNPIN
	) {
		Database.getAllBoardFiles(directory, uri).then((inner_path) => {
			if (inner_path.length) {
				//Pin in chunks to avoid max variables problem in endpoint
				let [chunkSize, i] = [998, 0];
				var chunk = inner_path.slice(i * chunkSize, (i + 1) * chunkSize);
				while (chunk.length) {
					this.cmd(action, { inner_path: chunk });
					i += 1;
					chunk = inner_path.slice(i * chunkSize, (i + 1) * chunkSize);
				}
				this.urlRoute();
			}
		});
	}

	downloadBoardFiles(directory: string, uri: string, big: boolean) {
		Database.getAllBoardFiles(directory, uri).then((files) => {
			this.cmd(CMD.WRAPPER_NOTIFICATION, [
				"done",
				`Requesting ${files.length} files`,
				config.notification_time,
			]);
			files.forEach((file) => {
				if (big) {
					file += "|all";
				}
				this.cmd(CMD.FILE_NEED, { inner_path: file }, (ok) => {
					console.debug(file, ok);
				});
			});
		});
	}

	blacklistBoard(directory: string, uri: string) {
		const deletionWarning =
			"This will delete <b>all</b> files that were downloaded from this board!";
		this.cmd(CMD.WRAPPER_NOTIFICATION, [
			"warning",
			deletionWarning,
			config.notification_time,
		]);
		this.cmd(
			CMD.WRAPPER_CONFIRM,
			[`Are you sure you want to blacklist <b>/${uri}/</b>?`],
			(confirmed) => {
				if (confirmed) {
					store.dispatch("setProcessing", {
						is_processing: true,
						msg: "Deleting files...",
					});
					this.cmd(
						CMD.FILE_GET,
						{ inner_path: this.blacklist_path, required: false },
						(data) => {
							let local_blacklist = data
								? JSON.parse(data)
								: {
										boards: [],
										users: [],
								  };
							local_blacklist.boards.push(`${directory}:${uri}`);
							this.setLocalBlacklist(local_blacklist);
						}
					);

					Database.getAllBoardFiles(directory, uri)
						.then((files) => {
							files.forEach((file) => {
								console.debug(`deleting ${file}`);
								this.cmd(CMD.OPTIONAL_FILE_DELETE, [file, config.address]);
							});
						})
						.catch((err) => {
							this.error(err);
						})
						.finally(() => {
							store.dispatch("setProcessing", { is_processing: false });
						});
				}
			}
		);
	}

	async unfollowThread(thread_id: string) {
		let local_storage = await this.getLocalSettings();
		if (local_storage["watched_threads"] === undefined) {
			local_storage["watched_threads"] = [];
		}
		if (!local_storage["watched_threads"].includes(thread_id)) {
			return;
		}
		local_storage["watched_threads"] = local_storage["watched_threads"].filter(
			(thread) => thread !== thread_id
		);
		this.setLocalSettings(local_storage);
		this.updateFollowFeed(
			local_storage["watched_threads"],
			"Thread unfollowed"
		);
		this.getLocalStorage();
	}

	async followThread(thread_id: string) {
		let local_storage = await this.getLocalSettings();
		if (local_storage["watched_threads"] === undefined) {
			local_storage["watched_threads"] = [];
		}
		if (local_storage["watched_threads"].includes(thread_id)) {
			return;
		}
		local_storage["watched_threads"].push(thread_id);
		this.setLocalSettings(local_storage);
		this.updateFollowFeed(local_storage["watched_threads"], "Thread followed");
		this.getLocalStorage();
	}

	updateFollowFeed(watched_threads: string[], update_message: string) {
		watched_threads = watched_threads.filter((thread) => thread !== null);
		let threads = watched_threads.join("','");
		const query = `
		SELECT p.id As event_uri,
		'comment' AS type,
		p.time AS date_added,
		IFNULL(CASE LENGTH(t.subject)
			WHEN 0 THEN t.id
			ELSE t.subject
		END, t.id) AS title,
		(
		WITH parse(parsed, txt) AS (
			VALUES('', p.body) union
			SELECT SUBSTR(txt, 1, 1),
			CASE WHEN
			SUBSTR(txt,1, 1) = '>'
			AND SUBSTR(txt,10,1) = '-'
			AND SUBSTR(txt,15,1) = '-'
			AND SUBSTR(txt,20,1) = '-'
			AND SUBSTR(txt,25,1) = '-'
			THEN SUBSTR(txt, 32)
			ELSE SUBSTR(txt, 2)
			END FROM parse
			WHERE LENGTH(txt) > 0
		) SELECT GROUP_CONCAT(parsed,'') FROM parse) AS body,
		'?:' || p.directory || ':' || p.uri || ':' || p.thread || ':50#post-' || p.id AS url
		FROM posts p
		INNER JOIN posts t
		ON p.thread = t.id
		WHERE p.thread IN ('${threads}')
		`;
		this.cmd(CMD.FEED_FOLLOW, [{ Replies: [query, [""]] }]);
		this.cmd(CMD.WRAPPER_NOTIFICATION, [
			"done",
			update_message,
			config.notification_time,
		]);
	}

	acceptedDomains(): Promise<string[]> {
		return new Promise((resolve) => {
			resolve(config.accepted_domains);
		});
	}

	selectUser(onSelection: Callback = null) {
		this.acceptedDomains().then((accepted_domains) => {
			if (this.siteInfo.cert_user_id == null) {
				if (accepted_domains.includes(config.domain.toLowerCase())) {
					this.cmd(
						CMD.WRAPPER_CONFIRM,
						[
							this.$t("message.ConfirmSelectCertificateText"),
							[
								this.$t("message.ConfirmSelectCertificateChoose"), // => 1
								this.$t("message.ConfirmSelectCertificateCreate"),
							], // => 2
						],
						(confirmed) => {
							if (confirmed == 1) {
								//zeronet returns the clicked button in position and not index (first button = 1)
								this.showSelectUser(accepted_domains, onSelection);
								return;
							} else if (confirmed == 2) {
								store.dispatch("setProcessing", {
									is_processing: true,
									msg: "Creating certificate...",
								});
								this.createCert()
									.then(onSelection)
									.finally(() => {
										store.dispatch("setProcessing", { is_processing: false });
									});
								return;
							} else {
								//cancel by default
								return;
							}
						}
					);
				}
			} else {
				this.showSelectUser(accepted_domains, onSelection);
			}
		});
	}

	showSelectUser(accepted_domains: string[], onSelection: Callback = null) {
		this.cmd(
			CMD.CERT_SELECT,
			{ accepted_domains: accepted_domains },
			(result) => {
				if (result == "ok") {
					this.onOpenWebsocket();
					if (onSelection) onSelection(null);
				}
			}
		);
	}

	async checkCert(generate = true) {
		return new Promise((resolve) => {
			if (generate && !this.siteInfo.cert_user_id) {
				if (this.siteInfo.cert_user_id == null) {
					this.selectUser(() => {
						store.dispatch("setUserID", this.siteInfo.cert_user_id);
						resolve();
					});
				}
				return;
			}
			store.dispatch("setUserID", this.siteInfo.cert_user_id);
			resolve();
		});
	}

	innerContentPath(auth_address = this.siteInfo.auth_address) {
		return `data/users/${auth_address}/content.json`;
	}

	checkContentJSON() {
		return new Promise((resolve) => {
			let content_path = this.innerContentPath();
			if (!config.inner_path_regex.test(content_path)) {
				resolve();
				return;
			}
			this.cmd(
				CMD.FILE_GET,
				{ inner_path: content_path, required: false },
				(data) => {
					if (data) {
						data = JSON.parse(data);
						if (
							data.optional == "(?!data.json)" &&
							data.ignore == "download/.*|(settings|blacklist).json(-old)?"
						) {
							resolve();
							return;
						}
					} else {
						data = {};
					}
					data.optional = "(?!data.json)";
					data.ignore = "download/.*|(settings|blacklist).json(-old)?";
					this.cmd(CMD.FILE_WRITE, [content_path, encode(data)], (res) => {
						if (res !== "ok") {
							this.error(res.error);
						}
						resolve();
					});
				}
			);
		});
	}

	createCert() {
		return new Promise((resolve, reject) => {
			console.debug("Fetching bitcoin lib");
			Promise.all([bitcoinJSMSG(), bitcoinJS()]).then(([msg, bjs]) => {
				console.debug("Creating new certificate");
				this.cmd(CMD.WRAPPER_NOTIFICATION, [
					"info",
					"Generating anonymous certificate",
					config.notification_time,
				]);
				let addr = this.siteInfo.auth_address,
					anonKey: { privateKey: Buffer; compressed: boolean },
					auth_user_name: string,
					cert: string;
				anonKey = bjs.ECPair.fromWIF(config.anonWIF);
				auth_user_name = addr.slice(0, 15);
				cert = msg
					.sign(
						`${addr}#web/${auth_user_name}`,
						anonKey.privateKey,
						anonKey.compressed
					)
					.toString("base64");
				this.cmd(
					CMD.CERT_ADD,
					[config.domain.toLowerCase(), "web", auth_user_name, cert],
					(res) => {
						if (res == "ok") {
							this.cmd(CMD.WRAPPER_NOTIFICATION, [
								"done",
								"Anonymous certificate generated.",
								config.notification_time,
							]);
							store.dispatch(
								"setUserID",
								`${auth_user_name}this.${config.domain.toLowerCase()}`
							);
							resolve();
						} else if (res != "Not changed") {
							this.error(res.error);
							reject(res.error);
						}
					}
				);
			});
		});
	}

	async createBoard() {
		await Promise.all([this.checkCert(), this.checkContentJSON()]);
		this.log("Creating new board");
		let maybe_board_uri = optionalValue("board_uri"),
			maybe_board_title = optionalValue("board_title");
		if (maybe_board_uri && maybe_board_title) {
			let board_uri = maybe_board_uri,
				board_title = maybe_board_title;
			this.cmd(
				CMD.FILE_GET,
				{ inner_path: this.inner_path, required: false },
				(data) => {
					let parser = new DataParser(data),
						new_data;
					try {
						new_data = parser.newBoard(board_uri, board_title);
					} catch (error) {
						this.error(error);
						return;
					}
					if (new_data) {
						this.log("Writing data to file");
						this.cmd(CMD.FILE_WRITE, [this.inner_path, new_data], (res) => {
							if (res == "ok") {
								this.cmd(CMD.WRAPPER_NOTIFICATION, [
									"done",
									`Board /${board_uri}/ created!`,
									config.notification_time,
								]);
								this.publishUpdate().then(() => this.urlRoute());
							} else {
								this.error(`File write error: ${res.error}`);
							}
						});
					} else {
						this.error(
							`There was a problem with parsing the board data: ${data}`
						);
					}
				}
			);
		} else {
			if (!maybe_board_uri) this.error("Missing uri");
			if (!maybe_board_title) this.error("Missing title");
		}
	}

	async editBoard(settings: Board) {
		await Promise.all([this.checkCert(), this.checkContentJSON()]);
		this.log("Editing board");
		this.cmd(
			CMD.FILE_GET,
			{ inner_path: this.inner_path, required: false },
			(data) => {
				let parser = new DataParser(data),
					new_data;
				new_data = parser.editBoard(settings);
				this.cmd(CMD.FILE_WRITE, [this.inner_path, new_data], (res) => {
					if (res == "ok") {
						this.cmd(CMD.WRAPPER_NOTIFICATION, [
							"done",
							"Board edited!",
							config.notification_time,
						]);
						this.publishUpdate().then(() => this.urlRoute());
					} else {
						this.error(`File write error: ${res.error}`);
					}
				});
			}
		);
	}

	killUser(auth_address: string, user_dir: string) {
		let content_path = this.innerContentPath(auth_address);
		this.cmd(
			CMD.FILE_GET,
			{ inner_path: content_path, required: false },
			(data) => {
				if (data.error) {
					this.error(data.error);
					return;
				}
				let cert = JSON.parse(data).cert_user_id;
				const deleteWarning =
					"This will delete <b>all</b> content that was downloaded from this user!";
				this.cmd(CMD.WRAPPER_NOTIFICATION, [
					"warning",
					deleteWarning,
					config.notification_time,
				]);

				this.cmd(CMD.WRAPPER_PROMPT, ["Reason", "text"], (reason) => {
					this.cmd(CMD.MUTE_ADD, [auth_address, cert, reason], (confirmed) => {
						if (confirmed == "ok") {
							store.dispatch("setProcessing", {
								is_processing: true,
								msg: "Deleting files...",
							});
							this.cmd(
								CMD.FILE_LIST,
								{ inner_path: `/data/${user_dir}` },
								(filelist: string[]) => {
									filelist.forEach((file) => {
										if (!["content.json", "data.json"].includes(file)) {
											console.debug("deleting", `data/${user_dir}/${file}`);
											this.cmd(CMD.OPTIONAL_FILE_DELETE, [
												`data/${user_dir}/${file}`,
												config.address,
											]);
										}
									});
									store.dispatch("setProcessing", { is_processing: false });
									this.urlRoute();
								}
							);
						}
					});
				});
			}
		);
	}

	deletePost(post: Post, user_dir: string) {
		const deleteWarning = "Are you sure you want to delete this post?";
		this.cmd(CMD.WRAPPER_CONFIRM, [deleteWarning], (confirmed) => {
			if (confirmed) {
				store.dispatch("setPosting", true);
				if (post.files) {
					JSON.parse(post.files).forEach((file: Archive) => {
						console.debug("deleting", `data/${user_dir}/src/${file.original}`);
						this.cmd(CMD.FILE_DELETE, [
							`data/${user_dir}/src/${file.original}`,
						]);
						if (file.thumb) {
							console.debug("deleting", `data/${user_dir}/${file.thumb}`);
							this.cmd(CMD.FILE_DELETE, [`data/${user_dir}/${file.thumb}`]);
						}
					});
				}

				this.cmd(
					CMD.FILE_GET,
					{ inner_path: this.inner_path, required: false },
					(data) => {
						let parser = new DataParser(data),
							new_data;
						new_data = parser.deletePost(post);
						this.cmd(CMD.FILE_WRITE, [this.inner_path, new_data], (res) => {
							if (res == "ok") {
								this.cmd(CMD.WRAPPER_NOTIFICATION, [
									"done",
									"Post Deleted!",
									config.notification_time,
								]);
								this.publishUpdate().then(() => {
									this.urlRoute();
									store.dispatch("setPosting", false);
								});
							} else {
								this.error(`File write error: ${res.error}`);
								store.dispatch("setPosting", false);
							}
						});
					}
				);
			}
		});
	}

	async editPost(post: Post) {
		await Promise.all([this.checkCert(), this.checkContentJSON()]);
		store.dispatch("setPosting", true);
		let board_posts: Post[] = [];
		if (post.body) {
			board_posts = await Database.getAllBoardPosts(post);
		}
		this.log("Editing post");
		this.cmd(
			CMD.FILE_GET,
			{ inner_path: this.inner_path, required: false },
			(data) => {
				let parser = new DataParser(data),
					new_data;
				new_data = parser.editPost(post, board_posts);
				this.cmd(CMD.FILE_WRITE, [this.inner_path, new_data], (res) => {
					if (res == "ok") {
						this.cmd(CMD.WRAPPER_NOTIFICATION, [
							"done",
							"Post edited!",
							config.notification_time,
						]);
						this.publishUpdate().then(() => {
							this.urlRoute();
							store.dispatch("setPosting", false);
						});
					} else {
						this.error(`File write error: ${res.error}`);
						store.dispatch("setPosting", false);
					}
				});
			}
		);
	}

	async makePost(fileList: Archive[], post_body: string) {
		await Promise.all([this.checkCert(), this.checkContentJSON()]);
		store.dispatch("setPosting", true);
		this.log("Creating new post");
		let files = new Files(fileList);
		let processed_files = await files.process();
		let post = {
			id: uuidv4(),
			directory: requiredValue("post_dir"),
			uri: requiredValue("post_uri"),
			thread: optionalValue("post_thread"),
			subject: optionalValue("post_subject"),
			username: optionalValue("post_username"),
			capcode: false,
			time: this.getZeroNetTime(),
			body: post_body ? post_body.trim() : "",
		};

		let capcode = document.getElementById("post_capcode");
		if (capcode) {
			post.capcode = (<HTMLInputElement>capcode).checked;
		}

		if (post.body.length === 0 && processed_files.length === 0) {
			this.error("Empty post");
			store.dispatch("setPosting", false);
			return;
		}

		if (this.username !== post.username) {
			let local_storage = await this.getLocalStorage();
			local_storage["username"] = post.username;
			this.setLocalSettings(local_storage);
		}

		processed_files.forEach((file) => {
			file.directory = this.siteInfo.auth_address;
		});

		if (post.body || processed_files.length) {
			let writeThumbnailsJob = this.writeThumbnails(
				processed_files,
				`data/users/${this.siteInfo.auth_address}`
			);
			let writeBigFilesJob = this.uploadBigFiles(
				processed_files,
				`data/users/${this.siteInfo.auth_address}`
			);
			let board_posts: Post[] = [];
			if (post.body) {
				board_posts = await Database.getAllBoardPosts(post);
			}

			this.writePostToDisk(
				post,
				board_posts,
				processed_files,
				this.inner_path,
				writeThumbnailsJob,
				writeBigFilesJob
			);
		} else {
			this.error("Empty post");
			store.dispatch("setPosting", false);
		}
	}

	writePostToDisk(
		post: Post,
		board_posts: Post[],
		files: Archive[],
		inner_path: string,
		writeThumbnailsJob: Promise<unknown>,
		writeBigFilesJob: Promise<unknown>
	) {
		this.cmd(
			CMD.FILE_GET,
			{ inner_path: inner_path, required: false },
			async (data) => {
				let parser = new DataParser(data),
					new_data;
				new_data = parser.newPost(post, files, board_posts);
				this.log("Writing data to file");
				this.cmd(CMD.FILE_WRITE, [inner_path, new_data], (res) => {
					if (res == "ok") {
						Promise.all([writeThumbnailsJob, writeBigFilesJob]).then(() => {
							this.cmd(CMD.WRAPPER_NOTIFICATION, [
								"done",
								"New post created!",
								config.notification_time,
							]); //TODO needs to be translatable
							if (config.auto_follow_created_threads && !post.thread) {
								this.followThread(post.id);
							}
							this.publishUpdate().then(() => {
								viewer.clearForm();
								store.dispatch("setPosting", false);
								store.dispatch("setProgress", 0);
								this.urlRoute();
							});
						});
					} else {
						this.error(`File write error: ${res.error}`);
						store.dispatch("setPosting", false);
						store.dispatch("setProgress", 0);
					}
				});
			}
		);
	}

	modAction(action: number, uri: string, info: string) {
		let undo_action: number,
			confirm_msg: string = "",
			done_msg: string;
		switch (action) {
			case config.action.STICK:
			case config.action.BL_POST:
			case config.action.BL_USER:
				switch (action) {
					case config.action.STICK:
						confirm_msg = `Are you sure you want to stick thread <b>${info}</b>?`;
						done_msg = "Thread sticked";
						break;
					case config.action.BL_POST:
						confirm_msg = `Are you sure you want to blacklist post <b>${info}</b>?`;
						done_msg = "Post blacklisted";
						break;
					case config.action.BL_USER:
						confirm_msg = `Are you sure you want to blacklist user <b>${info}</b>?`;
						done_msg = "User blacklisted";
						break;
				}

				this.cmd(CMD.WRAPPER_CONFIRM, [confirm_msg], (confirmed) => {
					if (confirmed) {
						this.cmd(
							CMD.FILE_GET,
							{ inner_path: this.inner_path, required: false },
							(data) => {
								let action_data = {
									uri: uri,
									action: action,
									info: info,
								};
								let parser = new DataParser(data),
									new_data;
								new_data = parser.newAction(action_data);
								this.cmd(CMD.FILE_WRITE, [this.inner_path, new_data], (res) => {
									if (res == "ok") {
										this.cmd(CMD.WRAPPER_NOTIFICATION, [
											"done",
											done_msg,
											config.notification_time,
										]);
										this.publishUpdate().then(() => this.urlRoute());
									} else {
										this.error(`File write error: ${res.error}`);
									}
								});
							}
						);
					}
				});
				break;

			case config.action.UNDO_STICK:
			case config.action.UNDO_BL_POST:
			case config.action.UNDO_BL_USER:
				switch (action) {
					case config.action.UNDO_STICK:
						undo_action = config.action.STICK;
						confirm_msg = `Are you sure you want to <b>unstick</b> thread <b>${info}</b>?`;
						done_msg = "Post stick undone";
						break;
					case config.action.UNDO_BL_POST:
						undo_action = config.action.BL_POST;
						confirm_msg = `Are you sure you want to <b>undo</b> the blacklist of post <b>${info}</b>?`;
						done_msg = "Post blacklist undone";
						break;
					case config.action.UNDO_BL_USER:
						undo_action = config.action.BL_USER;
						confirm_msg = `Are you sure you want to <b>undo</b> the blacklist of <b>${info}</b>?`;
						done_msg = "User blacklist undone";
						break;
				}

				this.cmd(CMD.WRAPPER_CONFIRM, [confirm_msg], (confirmed) => {
					if (confirmed) {
						this.cmd(
							CMD.FILE_GET,
							{ inner_path: this.inner_path, required: false },
							(data) => {
								let action_data = {
									uri: uri,
									action: undo_action,
									info: info,
								};
								let parser = new DataParser(data),
									new_data;
								new_data = parser.delAction(action_data);
								this.cmd(CMD.FILE_WRITE, [this.inner_path, new_data], (res) => {
									if (res == "ok") {
										this.cmd(CMD.WRAPPER_NOTIFICATION, [
											"done",
											done_msg,
											config.notification_time,
										]);
										this.publishUpdate().then(() => this.urlRoute());
									} else {
										this.error(`File write error: ${res.error}`);
									}
								});
							}
						);
					}
				});
				break;
			default:
				console.error(`Invalid mod action: ${action}`);
		}
	}

	writeThumbnails(files: Archive[], inner_path: string) {
		return new Promise((resolve) => {
			if (files.length) {
				this.log("Writing thumbnails to disk");
				let thumbnails = new Thumbnails(files, inner_path, resolve);
				thumbnails.process();
			} else {
				resolve();
			}
		});
	}

	uploadBigFiles(files: Archive[], inner_path: string) {
		return new Promise((resolve) => {
			if (files.length == 0) {
				resolve();
				return;
			}
			this.progress = 0;
			files.forEach((file) => {
				let local_file = file;
				if (local_file.original) {
					this.cmd(
						CMD.BIG_FILE_UPLOAD_INIT,
						[`${inner_path}/src/${local_file.original}`, local_file.size],
						(init_res) => {
							let formdata = new FormData();
							formdata.append(local_file.name, local_file);
							let req = new XMLHttpRequest();
							req.open("POST", init_res.url);
							req.setRequestHeader(
								"Content-Type",
								"application/x-www-form-urlencoded"
							);
							req.onreadystatechange = () => {
								if (req.readyState == XMLHttpRequest.DONE) {
									this.progress++;
									if (this.progress == files.length) {
										resolve();
									}
								}
							};
							req.withCredentials = true;
							req.send(formdata);
						}
					);
				}
			});
		});
	}
}
