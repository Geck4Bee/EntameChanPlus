import { Thread } from "Util";

export class Config {
	readonly anonWIF = "KxqUqNiJtKkvz5Vz4T92uZyw7n67Vvzm6Wq9nKr4RCbdDKAtrqzk";
	readonly address = window.location.pathname.replace(/\//g, "");
	readonly domain = "Millchan";
	readonly debug = false;
	readonly notification_time = 6000;
	readonly noroute_redirect = true;
	readonly show_mention = true;
	readonly animate_gifs = false;
	readonly spoiler_thumbnails = true;
	readonly highlight_code = true;
	readonly force_anonymous = false;
	readonly always_spoiler = false;
	readonly auto_follow_created_threads = true;
	readonly enable_blacklist_by_default = true;
	readonly default_to_catalog = false;
	readonly user_data_regex = /^data\/(users\/\w{32,34})\/data.json$/;
	readonly default_404_image = "static/logo.png";
	readonly default_video_image = "static/video.png";
	readonly default_error_image = "static/error.png";
	readonly default_doc_image = "static/doc.png";
	readonly default_audio_image = "static/audio.png";
	readonly default_spoiler_image = "static/spoiler.png";
	readonly default_options_image = "static/options.png";
	readonly logo = "static/logo.svg";
	readonly fallback_logo = "static/logo.png";
	readonly video_thumbnail_position = 0.1;
	readonly thumbnail_quality = 90;
	readonly accepted_domains = ["millchan", "zeroid.bit"];
	readonly max_format_workers = 4;
	readonly max_resize_workers = 2;
	readonly visibility_throttle = 250;
	readonly delay_tolerance = 300000; // 5min
	readonly max_time_between_site_info_updates = 10000; // 10s
	readonly max_time_between_server_info_updates = 10000; // 10s
	readonly info_update_debounce_time = 5000; // 5s
	readonly archive_snackbar_timeout = 10000; // 10s
	readonly jpegjs_max_memory = 1024;

	//Viewer
	readonly max_recent_posts = 50;
	readonly recent_posts = 5;
	readonly max_popular_boards = 100;
	readonly popular_boards = 15;
	readonly threads_per_page = 15;
	readonly max_pages = 15;
	readonly posts_preview = 3;
	readonly max_new_boards = 5;
	readonly last_posts = 50;
	readonly media_volume = 0.9;
	readonly lazy_load_posts = false;
	readonly max_lazy_load_tries = 15;

	//Mimetype
	readonly mime2ext: { [key: string]: string } = {
		"image/gif": ".gif",
		"image/png": ".png",
		"image/jpeg": ".jpg",
		"image/webp": ".webp",

		"video/webm": ".webm",
		"video/mp4": ".mp4",

		"audio/ogg": ".ogg",
		"audio/mpeg": ".mp3",
		"audio/mp3": ".mp3",

		"application/pdf": ".pdf",
		"application/epub+zip": ".epub",
		"application/gzip": ".tar.gz",
		"application/zip": ".zip",
	};

	readonly allowed_image_mimetype = [
		"image/gif",
		"image/png",
		"image/jpeg",
		"image/webp",
	];
	readonly allowed_video_mimetype = ["video/webm", "video/mp4"];
	readonly allowed_audio_mimetype = ["audio/ogg", "audio/mpeg", "audio/mp3"];
	readonly allowed_doc_mimetype = [
		"application/pdf",
		"application/epub+zip",
		"application/gzip",
		"application/zip",
	];

	readonly allowed_mimetype = this.allowed_image_mimetype
		.concat(this.allowed_video_mimetype)
		.concat(this.allowed_audio_mimetype)
		.concat(this.allowed_doc_mimetype);

	//Post-validation
	readonly image_src_regex = /^data\/users\/\w{32,34}\/[a-z0-9]{40}-thumb\.(png|jpeg|jpg|gif)$/;
	readonly media_source_regex = /^data\/users\/\w{32,34}\/src\/[a-z0-9]{40}\.(png|jpeg|jpg|webp|gif|webm|mp4|ogg|mp3|pdf|epub|tar\.gz|zip)$/;
	readonly postid_regex = /^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/;
	readonly media_max_width = 200;
	readonly media_max_height = 200;
	readonly inner_path_regex = /^data\/users\/\w{32,34}\/(data|content|settings|blacklist)\.json$/;

	readonly images_batch = 50;
	readonly images_preview = 5;
	readonly max_body_length = 5000;
	readonly max_subject_length = 100;
	readonly board_uri_regex = /^[\w]{1,30}$/;

	//Routes
	readonly routes = [
		[/^$/, "home"],
		[/^\?:(users\/\w{32,34}):(\w+)$/, "board"],
		[
			/^\?:(users\/\w{32,34}):(\w+):(\w{8}-\w{4}-\w{4}-\w{4}-\w{12})(?::(\d+))?$/,
			"thread",
		],
		[/^\?:(users\/\w{32,34}):(\w+):(\d+)$/, "page"],
		[/^\?:(users\/\w{32,34}):(\w+):catalog$/, "catalog"],
		[/^\?:(users\/\w{32,34}):(\w+):edit$/, "edit"],
		[/^\?:(users\/\w{32,34}):(\w+):blacklist$/, "blacklist"],
		[/^\?search$/, "search"],
	];

	//Mod actions
	readonly action = {
		BL_POST: 0, //Blacklist post
		BL_USER: 1, //Blacklist user
		UNDO_BL_POST: 3, //Remove post from blacklist
		UNDO_BL_USER: 4, //Remove user from blacklist
		STICK: 5, //Stick thread
		UNDO_STICK: 6, //Unstick thread
	};

	//Styles
	readonly styles = ["light.css", "dark.css"];
	readonly dark_themes = ["dark.css"];
	readonly default_theme = "dark.css";
	readonly enabled_themes = ["style.css", "highlight.css", "vuetify.css"];

	//Catalog sort
	readonly sortBy = {
		BumpOrder: (threads: Thread[]) => {
			threads.sort(function (t1, t2) {
				return t1.thread_no - t2.thread_no;
			});
		},
		ReplyCount: (threads: Thread[]) => {
			threads.sort(function (t1, t2) {
				if (t2.replies && t1.replies) {
					return t2.replies.length - t1.replies.length;
				}
				return t1.replies ? -1 : 1;
			});
		},
		CreationDate: (threads: Thread[]) => {
			threads.sort(function (t1, t2) {
				return +t2.time - +t1.time;
			});
		},
		RandomOrder: (threads: Thread[]) => {
			for (let i = threads.length - 1; i > 0; i--) {
				let j = Math.floor(Math.random() * (i + 1));
				[threads[i], threads[j]] = [threads[j], threads[i]];
			}
		},
	};

	update(config: Config) {
		let map = new Map(Object.entries(config));
		map.forEach((val, key) => {
			(<any>this)[key] = val;
		});
	}

	userConfig(local_config: { [key: string]: any }) {
		const keys = [
			"visibility_throttle",
			"recent_posts",
			"max_recent_posts",
			"max_pages",
			"popular_boards",
			"threads_per_page",
			"posts_preview",
			"images_preview",
			"images_batch",
			"max_new_boards",
			"last_posts",
			"animate_gifs",
			"spoiler_thumbnails",
			"highlight_code",
			"force_anonymous",
			"always_spoiler",
			"auto_follow_created_threads",
			"enable_blacklist_by_default",
			"default_to_catalog",
			"debug",
			"media_volume",
			"archive_snackbar_timeout",
			"jpegjs_max_memory",
			"max_resize_workers",
		];
		return keys.reduce((acc: { [key: string]: any }, key) => {
			acc[key] = local_config[key] || Object(this)[key];
			return acc;
		}, {});
	}
}
