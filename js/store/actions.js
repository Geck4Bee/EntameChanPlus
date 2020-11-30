import { Database } from "../millchan/database.ts";

export default {
	setUsername: ({ commit }, username) => commit("setUsername", username),
	setUserID: ({ commit }, userid) => commit("setUserID", userid),
	setWatchedThreads: ({ commit }, watched_threads) => commit("setWatchedThreads", watched_threads),
	setThreadTitle: ({ commit }, context) => commit("setThreadTitle", context),
	setProcessing: ({ commit }, context) => commit("setProcessing", context),
	setLocalStorage: ({ commit }, local_storage) => commit("setLocalStorage", local_storage),
	setDarkTheme: ({ commit }, theme) => commit("setDarkTheme", theme),
	setProgress: ({ commit }, progress) =>  commit("setProgress", progress),
	setShowingLastPosts: ({ commit }, showing_last_posts) => commit("setShowingLastPosts", showing_last_posts),
	setPosting: ({ commit }, is_posting) => commit("setPosting", is_posting),
	setLocalBlacklist: ({ commit }, local_blacklist) => commit("setLocalBlacklist", local_blacklist),
	setTorEnabled: ({ commit }, tor_enabled) => commit("setTorEnabled", tor_enabled),

	getUserCertIDs: ({ commit }, context) => {
		Database.getUserCertIDs(context).then(user_cert_ids => {
			commit("setUserCertIDs", user_cert_ids)
		});
	},
	getBoardInfo: ({ commit }, context) => {
		Database.getBoardInfo(context).then(boardinfo => {
			commit("setBoardInfo", boardinfo)
		});
	},
	getJsonID: ({ commit }, context) => {
		Database.getJsonID(context).then(json_id => {
			commit("setUserJsonID", json_id)
		})
	},
	getUserDirs: ({ commit }) => {
		Database.getUserDirs().then(user_dirs => {
			commit("setUserDirs", user_dirs)
		})
	},
	getBlacklist: ({ commit }, context) => {
		Database.getBlacklist(context).then(([bl_users, bl_posts]) => {
			let bl_users_set = new Set();
			bl_users.forEach(bl_user => {
				bl_users_set.add(bl_user.json_id);
			})
			commit("setBlacklistedUsers", bl_users_set)

			let bl_posts_set = new Set();
			bl_posts.forEach(bl_post => {
				bl_posts_set.add(`${bl_post.info}:${bl_post.uri}`)
			})
			commit("setBlacklistedPosts", bl_posts_set)
		})
	},
	getThreads: ({ commit }, context) => {
		Database.getAllThreads(context).then(all_threads => {
			commit("setAllThreads", all_threads)
			Database.getThreadsReplies(all_threads, context).then(threads => {
				commit("setThreads", threads)
			})
		})
	},
	getHelpList: ({ commit }) => {
		Millchan.cmd("optionalHelpList", {}, (dirs) => {
			commit("setSeedDirs", dirs)
		})
	},

	renderHome: ({ commit, dispatch }, context) => {
		dispatch("getUserCertIDs", context)
		dispatch("getUserDirs")
		commit("setPinnedBoards", context.pinned)
		Database.getPopularBoards().then(popular_boards => {
			commit("setPopularBoards", popular_boards);
		})
		Database.getUserBoards(context.auth_address).then(user_boards => {
			commit("setUserBoards", user_boards);
		})
		commit("render", context)
	},

	//Fetches things common between page, catalog and thread routes
	fetchCommon: ({ commit, dispatch}, context) => {
		dispatch("getHelpList")
		dispatch("getUserDirs")
		dispatch("getBlacklist", context)
		dispatch("getBoardInfo", context)
		dispatch("getJsonID", context)
		dispatch("getUserCertIDs", context)
		commit("setIsUserBoard", context.is_user_board)
		commit("setBlacklistActive", context.is_blacklist_active)
		commit("setThreadLimit", context.limit)
		commit("render", context)
	},
	renderPage: ({ dispatch }, context) => {
		dispatch("getThreads", context)
		dispatch("fetchCommon", context)
	},
	renderCatalog: ({ dispatch }, context) => {
		dispatch("getThreads", context)
		dispatch("fetchCommon", context)
	},
	renderThread: ({ commit, dispatch }, context) => {
		Database.getThread(context).then(thread => {
			commit("setPosts", thread)
		})
		dispatch("fetchCommon", context)
	},

	renderEdit: ({ commit, dispatch }, context) => {
		Database.getBlacklist(context).then(([bl_users, bl_posts]) => {
			let bl_users_set = new Set();
			bl_users.forEach(bl_user => {
				bl_users_set.add(bl_user);
			})
			commit("setBlacklistedUsers", bl_users_set)

			let bl_posts_set = new Set();
			bl_posts.forEach(bl_post => {
				bl_posts_set.add(bl_post)
			})
			commit("setBlacklistedPosts", bl_posts_set)
		})
		dispatch("getUserDirs")
		dispatch("getBoardInfo", context)
		commit("render", context)
	},
	renderBlacklist: ( { dispatch }, context) => {
		dispatch("renderEdit", context)
	},
	renderSearch: ({ commit, dispatch }, context) => {
		dispatch("getUserDirs")
		dispatch("getUserCertIDs", context)
		commit("render", context)
	}
}
