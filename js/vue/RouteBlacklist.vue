<template>
	<v-container grid-list-md>
	<board-info></board-info>
	<v-layout column align-center>
	<v-flex xs12>
	<blacklist :list="bl_users" :undo="undoBlacklistUser" title="User dir">
		<slot slot="header">{{$t("message.BlacklistedUsers")}}</slot>
		<slot slot="empty">{{$t("message.NoBlacklistedUsers")}}</slot>
	</blacklist>
	<blacklist :list="bl_posts" :undo="undoBlacklistPost" title="Post ID" class="mt-4">
		<slot slot="header">{{$t("message.BlacklistedPosts")}}</slot>
		<slot slot="empty">{{$t("message.NoBlacklistedPosts")}}</slot>
	</blacklist>
	</v-flex>
	</v-layout>
	<div id="bottom-links">
	<a @click.prevent="renderHome()" :href="location.pathname">[{{$t("message.Home")}}]</a>
	</div>
	</v-container>
</template>

<script>
import BoardInfo from "Board/BoardInfo.vue";
import Blacklist from "Blacklist/Blacklist.vue";
import { mapState } from "vuex";
import { renderMixin, blMixin } from "Mixins";

export default {
	mixins: [renderMixin],
	components: {
		"board-info": BoardInfo,
		"blacklist": Blacklist
	},
	methods: {
		...blMixin.methods
	},
	computed: mapState([
		"bl_posts",
		"bl_users"
	]),
	data() {
		return {
			location: window.location
		};
	}
}
</script>
