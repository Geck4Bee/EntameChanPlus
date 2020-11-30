export default {
	postsByID: state => {
		return state.posts.reduce(function(acc, post) {
			acc[post.id] = post;
			return acc;
		}, {});
	},
	totalPostsByBoard: state => {
		return state.popular_boards.reduce((acc, board) => {
			acc[`${board.directory}:${board.uri}`] = board.total_posts;
			return acc;
		}, {});
	},
	boardURI: state => {
		return `${state.location.pathname}?:${state.directory}:${state.uri}:0`;
	},
	catalogURL: state => {
		return `${state.location.pathname}?:${state.directory}:${state.uri}:catalog`;
	},
	isInUserBlacklist: state => post => {
		return state.bl_users.has(post.json_id);
	},
	isInPostBlacklist: state => post => {
		return state.bl_posts.has(`${post.id}:${post.uri}`);
	},
	isBlackListed: (state, getters) => post => {
		return getters.isInUserBlacklist(post) || getters.isInPostBlacklist(post);
	},
	filteredThreads: (state, getters) => {
		let threads = state.blacklist_active ? state.threads.filter((thread) => !getters.isBlackListed(thread)) : state.threads;
		if (state.search_thread) {
			// TODO: sort giving priority to subject
			const term = state.search_thread.toLowerCase();
			threads = threads.filter(thread => thread.subject && thread.subject.toLowerCase().includes(term) ||
				thread.body && thread.body.toLowerCase().includes(term));
		}
		return threads;
	},
	threads: (state, getters) => {
		let threads = getters.filteredThreads;
		let page = state.page;
		let offset = page * config.threads_per_page;
		return threads.slice(offset, offset+config.threads_per_page);
	},
	allThreads: (state, getters) => {
		let threads = [],
		thread_no = 0,
		all_threads = !state.blacklist_active ? state.threads : getters.filteredThreads;
		all_threads.some(thread => {
			thread.thread_no = thread_no++;
			threads.push(thread)
			if (thread_no >= config.max_pages * config.threads_per_page) {
				return true;
			}
		})
		if (state.local_storage.catalog_sort in config.sortBy) {
			config.sortBy[state.local_storage.catalog_sort](threads);
		}
		return threads;
	},
	normal_nav: (state) => {
		if (state.search_thread) {
			return [1];
		}
		let upper = Math.min(config.max_pages, Math.ceil(state.all_threads.length/config.threads_per_page)+ 1);
		return [...Array(upper).keys()].splice(1);
	},
	blacklist_nav: (state, getters) => {
		if (state.search_thread) {
			return [1];
		}
		let threads = state.all_threads.filter((thread) => !getters.isBlackListed(thread));
		let upper = Math.min(config.max_pages,Math.ceil(threads.length/config.threads_per_page)+ 1);
		return [...Array(upper).keys()].splice(1);
	},
	darkTheme(state) {
		return state.dark_theme;
	},
	showing_last_posts(state) {
		return state.thread_limit > 0 && state.replies_count > state.thread_limit;
	}
}
