<template>
	<v-container grid-list-md>
	<board-info></board-info>
	<v-layout column align-center>
	<v-flex xs3 text-center>
	<board-edit></board-edit>
	</v-flex>
	<v-flex xs12>
	<blacklist :list="bl_users" :undo="undoBlacklistUser" title="User dir" :owner="true">
		<slot slot="header">{{$t("message.BlacklistedUsers")}}</slot>
		<slot slot="empty">{{$t("message.NoBlacklistedUsers")}}</slot>
	</blacklist>
	<blacklist :list="bl_posts" :undo="undoBlacklistPost" title="Post ID" :owner="true" class="mt-4">
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
import BoardEdit from "Board/Edit.vue";
import Blacklist from "Blacklist/Blacklist.vue";
import { mapState } from "vuex";
import { renderMixin, blMixin } from "Mixins";

export default {
	mixins: [renderMixin],
	methods: {
		...blMixin.methods
	},
	components: {
		"board-info": BoardInfo,
		"board-edit": BoardEdit,
		"blacklist": Blacklist
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
