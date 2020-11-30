export default {
	location:  window.location,
	popular_boards: [],
	posts: [],
	pinned_boards: [],
	new_boards: [],
	local_storage: {},
	user_boards: [],
	dark_theme: false,
	userid: false,
	boardinfo: false,
	blacklist_active: true,
	is_user_board: false,
	username: null,
	processing: false,
	processing_message: "",
	directory: null,
	uri: null,
	page: 0,
	thread: null,
	catalog_sort: null,
	watched_threads: [],
	active_page: null,
	user_cert_ids: {},
	progress: 0,
	user_json_id: null,
	user_dirs: [],
	posting: false,
	local_blacklist: {},
	bl_posts: new Set(),
	bl_users: new Set(),
	all_threads: [],
	threads: [],
	threads_by_id: {},
	url_hash: false,
	search_thread: "",
	seed_dirs: {},
	thread_limit: 0,
	replies_by_id: {},
	replies_count: 0,
	tor_always: false
}