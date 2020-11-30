import Vue from "vue";
// @ts-ignore
import options from "../vue";

import { Post } from "Util";
import { isOnScreen } from "Util";
import { Database } from "./database";

// @ts-ignore
import store from "store";
import { Config } from "./config";
import { Engine } from "./millchan";

declare const Millchan: Engine;
declare const config: Config;

interface ExtendedVue extends Vue {
	show_quick_reply: boolean;
	show_create_reply: boolean;
	reply_body: string;
	previewX: number;
	previewY: number;
	preview_post: Post | null;
	renderThread: (post: any, last_posts: number) => void;
	$store: any;
	$t: (str: string) => string;
	$vuetify: any;
}

export class Viewer {
	vm: ExtendedVue;
	fetching_id?: string;

	constructor() {
		this.vm = new Vue(options);
	}

	clearForm() {
		this.vm.show_quick_reply = false;
		this.vm.show_create_reply = false;
		this.vm.reply_body = "";
	}

	routePost(post_id: string) {
		if (
			this.vm.$store.state.active_page == "thread" &&
			post_id in this.vm.$store.getters.postsByID
		) {
			this.vm.$vuetify.goTo(`#post-${post_id}`, { duration: 0 });
			return;
		}
		Database.getPost(post_id).then((post) => {
			if (post) {
				this.vm.renderThread(post, config.last_posts);
				this.delPreviewPost(post_id);
				return;
			}
			Millchan.error(`Post not found: <b>${post_id}</b>`);
		});
	}

	previewPost(event: MouseEvent, post_id: string) {
		let postSelector = `post-${post_id}`;
		let post = document.getElementById(postSelector);

		if (post && isOnScreen(post)) {
			let post_div = post.closest(".reply");
			if (post_div) {
				post_div.classList.add("preview_hover");
			}
			return;
		}

		if (store.getters.postsByID[post_id]) {
			this.vm.previewX = event.clientX;
			this.vm.previewY = event.clientY;
			this.vm.preview_post = store.getters.postsByID[post_id];
			return;
		}

		switch (this.vm.$store.state.active_page) {
			case "thread":
			case "page":
				this.fetching_id = post_id;
				Database.getPost(post_id).then((post) => {
					if (post && this.fetching_id == post_id) {
						this.vm.previewX = event.clientX;
						this.vm.previewY = event.clientY;
						this.vm.preview_post = post;
					}
				});
		}
	}

	delPreviewPost(post_id: string) {
		this.fetching_id = undefined;
		let postSelector = `post-${post_id}`;
		this.vm.preview_post = null;
		let number_span = document.getElementById(postSelector);
		if (number_span == null) {
			return;
		}
		let reply_div = number_span.closest(".reply");
		if (reply_div) {
			reply_div.classList.remove("preview_hover");
		}
	}

	addReply(reply_id: string, op_id: string) {
		store.commit("addNewReply", {
			op: op_id,
			reply: reply_id,
			postsByID: store.getters.postsByID,
		});
	}
}
