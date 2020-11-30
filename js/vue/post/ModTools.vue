<template>
<v-menu>
<template v-slot:activator="{ on }">
<button v-on="on" class="px-1">▶</button>
</template>
<v-list>
	<v-list-item v-if='!post.thread && !$store.state.watched_threads.includes(post.id)' @click='followThread(post)'>
		<v-list-item-title>{{$t("message.FollowThread")}}</v-list-item-title>
	</v-list-item>
	<v-list-item v-else-if='!post.thread && $store.state.watched_threads.includes(post.id)' @click='unfollowThread(post)'>
		<v-list-item-title>{{$t("message.UnfollowThread")}}</v-list-item-title>
	</v-list-item>
	<v-list-item v-if='!post.thread && $store.state.active_page == "page"' @click='hideThread(post)'>
		<v-list-item-title>{{$t("message.HideThread")}}</v-list-item-title>
	</v-list-item>
	<v-list-item v-if='!isUserPost(post.json_id)' @click='muteUser(post)'>
		<v-list-item-title>{{$t("message.MuteUser")}}</v-list-item-title>
	</v-list-item>
	<v-list-item v-if='$store.state.is_user_board && !post.thread && !post.sticky' @click='stickThread(post)'>
		<v-list-item-title>{{$t("message.StickThread")}}</v-list-item-title>
	</v-list-item>
	<v-list-item v-if='$store.state.is_user_board && !post.thread && post.sticky' @click='unstickThread(post)'>
		<v-list-item-title>{{$t("message.UnstickThread")}}</v-list-item-title>
	</v-list-item>
	<v-list-item v-if='$store.state.is_user_board && isInPostBlacklist(post)' @click='undoBlacklistPost(post.uri,post.id)'>
		<v-list-item-title>Undo post blacklist</v-list-item-title>
	</v-list-item>
	<v-list-item v-else-if='$store.state.is_user_board' @click='blacklistPost(post)'>
		<v-list-item-title>{{$t("message.BlacklistPost")}}</v-list-item-title>
	</v-list-item>
	<v-list-item v-if='$store.state.is_user_board && isInUserBlacklist(post)' @click='undoBlacklistUser(post.uri,$store.state.user_dirs[post.json_id])'>
		<v-list-item-title>Undo user blacklist</v-list-item-title>
	</v-list-item>
	<v-list-item v-else-if='$store.state.is_user_board' @click='blacklistUser(post)'>
		<v-list-item-title>{{$t("message.BlacklistUser")}}</v-list-item-title>
	</v-list-item>
	<v-list-item v-if='isUserPost(post.json_id) && !editing' @click='enableEdit'>
		<v-list-item-title>{{$t("message.EditPost")}}</v-list-item-title>
	</v-list-item>
	<v-list-item v-if='isUserPost(post.json_id)' @click='deletePost(post)'>
		<v-list-item-title>{{$t("message.DeletePost")}}</v-list-item-title>
	</v-list-item>
	<v-list-item v-if='slide_images.length > 1' @click='$root._data.slide_images = slide_images; $root._data.show_slider = true'>
		<v-list-item-title>Slideshow</v-list-item-title>
	</v-list-item>
	<v-list-item v-if='has_files' @click='$emit("all-files","download")'>
		<v-list-item-title>{{$t("message.DownloadAll")}}</v-list-item-title>
	</v-list-item>
	<v-list-item v-if='has_files' @click='$emit("all-files","request")'>
		<v-list-item-title>{{$t("message.SeedAll")}}</v-list-item-title>
	</v-list-item>
		<v-list-item v-if='has_files' @click='$emit("all-files","remove_spoilers")'>
		<v-list-item-title>{{$t("message.RemoveSpoilers")}}</v-list-item-title>
	</v-list-item>
	<v-list-item v-if='isSeedingDir(post)' @click='helpSeedStop(post)'>
		<v-list-item-title>{{$t("message.HelpSeedStop")}}</v-list-item-title>
	</v-list-item>
	<v-list-item v-else @click='helpSeed(post)'>
		<v-list-item-title>{{$t("message.HelpSeed")}}</v-list-item-title>
	</v-list-item>
</v-list>
</v-menu>
</template>

<script>
import { postMixin, blMixin, MenuMixin } from "Mixins";
import store from "store";
	
export default {
	mixins: [postMixin, blMixin, MenuMixin],
    props: ["post", "editing", "slide_images", "has_files"],
    methods: {
		enableEdit: function() {
			this.$emit("raw-body", this.ID2cite(this._props.post, this._props.post.body, true));
			this.$emit("update:editing", true);
		},
		helpSeed: function(post) {
			let user_dir = `data/${this.user_dirs[post.json_id]}`
			Millchan.cmd("optionalHelp", {directory: user_dir, address: config.address, title: "Millchan user"}, (res) => {
				store.dispatch("getHelpList")
			})
		},
		helpSeedStop: function(post) {
			let user_dir = `data/${this.user_dirs[post.json_id]}`
			Millchan.cmd("optionalHelpRemove", {directory: user_dir, address: config.address}, (res) => {
				store.dispatch("getHelpList")
				Millchan.cmd("wrapperNotification", ["done", this.$t("message.StoppedAutoSeed"), config.notification_time]);
			})
		},
		isSeedingDir: function(post) {
			let user_dir = `data/${this.user_dirs[post.json_id]}`
			return user_dir in this.$store.state.seed_dirs;
		},
		hideThread: function(thread) {
			store.state.local_storage[`hidden_threads`].push(thread.id);
			Millchan.setLocalSettings(store.state.local_storage, () => {
				Millchan.urlRoute();
			});
		}
	}
}
</script>
