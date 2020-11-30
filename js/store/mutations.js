export default {
	render (state, {directory, uri, thread, page, active_page}) {
		state.directory = directory;
		state.uri = uri;
		state.thread = thread;
		state.page = page;
		state.active_page = active_page;
	},
	setTorEnabled (state, tor_enabled) {
		state.tor_enabled = tor_enabled;
	},
	setUsername (state, username) {
		state.username = username;
	},
	setUserID (state, userid) {
		state.userid = userid;
	},
	setWatchedThreads (state, watched_threads) {
		state.watched_threads = watched_threads;
	},
	setThreadTitle (state, {thread, replies_count}) {
		let title = `(${replies_count})`;
		state.replies_count = replies_count;
		if (state.boardinfo.uri) {
			title += ` /${state.boardinfo.uri}/`;
		}
		if (thread && thread.subject) {
			title += ` ${thread.subject}`;
		}
		if (state.boardinfo.title) {
			title += ` - ${state.boardinfo.title}`;
		}
		title += ` - ${config.domain}`;
		Millchan.cmd("wrapperSetTitle", title);
	},
	setPosts (state, posts) {
		state.posts = posts;
	},
	setPinnedBoards (state, boards) {
		state.pinned_boards = boards;
	},
	setUserBoards (state, user_boards) {
		state.user_boards = user_boards;
	},
	setBoardInfo (state, boardinfo) {
		if (boardinfo && boardinfo.uri && boardinfo.title) {
			Millchan.cmd("wrapperSetTitle", `/${boardinfo.uri}/ - ${boardinfo.title}`);
		} else if (boardinfo && boardinfo.uri) {
			Millchan.cmd("wrapperSetTitle", `/${boardinfo.uri}/`);
		}
		state.boardinfo = boardinfo;
	},
	setIsUserBoard (state, is_user_board) {
		state.is_user_board = is_user_board;
	},
	setBlacklistActive (state, is_active) {
		if (is_active === undefined) {
			is_active = config.enable_blacklist_by_default;
		}
		state.blacklist_active = is_active;
	},
	setProcessing (state, {is_processing, msg}) {
		state.processing = is_processing;
		if (msg) {
			state.processing_message = msg;
		}
	},
	setLocalStorage (state, local_storage) {
		state.local_storage = local_storage;
	},
	setDarkTheme (state, theme) {
		state.dark_theme = config.dark_themes.includes(theme);
	},
	setPopularBoards (state, boards) {
		if (JSON.stringify(state.local_storage.popular_boards) === JSON.stringify({})) {
			boards.forEach(board => {
				let board_key  = `${board.directory}:${board.uri}`;
				state.local_storage.popular_boards[board_key] = {
					directory: board.directory,
					uri: board.uri,
					title: board.title,
				};
			});
			Millchan.setLocalSettings(state.local_storage)
		} else {
			let new_boards = [];
			boards.forEach(board => {
				let board_key  = `${board.directory}:${board.uri}`;
				if (!(board_key in state.local_storage.popular_boards)) {
					new_boards.splice(0, 0, board);
				}
			});
			state.new_boards = new_boards.slice(0, config.max_new_boards);
		}
		state.popular_boards = boards;
	},
	setUserCertIDs (state, user_cert_ids) {
		state.user_cert_ids = user_cert_ids;
	},
	setProgress (state, progress) {
		state.progress = progress;
	},
	setUserJsonID (state, json_id) {
		state.user_json_id = json_id;
	},
	setUserDirs (state, user_dirs) {
		state.user_dirs = user_dirs;
	},
	setPosting (state, is_posting) {
		state.posting = is_posting;
	},
	setLocalBlacklist (state, local_blacklist) {
		state.local_blacklist = local_blacklist;
	},
	setBlacklistedUsers (state, bl_users) {
		state.bl_users = bl_users;
	},
	setBlacklistedPosts (state, bl_posts) {
		state.bl_posts = bl_posts;
	},
	setAllThreads (state, all_threads) {
		state.all_threads = all_threads;
	},
	setThreads (state, threads) {
		let threads_by_id = {};
		threads.forEach(thread => {
			threads_by_id[thread.id] = thread;
			if (thread.replies) {
				thread.replies.forEach(reply => {
					threads_by_id[reply.id] = reply;
				});
			}
		});
		state.threads_by_id = threads_by_id;
		state.threads = threads;
	},
	setURLHash (state, url_hash) {
		state.url_hash = url_hash;
	},
	clearSearch (state) {
		state.search_thread = "";
	},
	setSeedDirs (state, dirs) {
		state.seed_dirs = dirs;
	},
	setThreadLimit (state, limit) {
		state.thread_limit = limit;
	},
	addNewReplyTarget (state, post_id) {
		if (!(post_id in state.replies_by_id)) {
			state.replies_by_id[post_id] = [];
		}
	},
	addNewReply (state, {op, reply, postsByID}) {
		if (!(op in state.replies_by_id)) {
			state.replies_by_id[op] = [];
		}
		if (!(state.replies_by_id[op].includes(reply))) {
			state.replies_by_id[op].push(reply);
		}
		state.replies_by_id[op].sort(function(p1, p2) {
			return postsByID[p1].time - postsByID[p2].time;
		});
	}
}
