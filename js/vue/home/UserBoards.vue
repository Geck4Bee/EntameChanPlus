<template>
<div class="home-container" id="home-userboards" v-if="user_boards && user_boards.length">
	<span class="home-info">{{$t("message.UserBoards")}}</span>
	<div v-for="board in user_boards">
	<a @click.prevent="renderPage(board)" :href="board|boardLink">{{boardTarget(board)}}</a>
	<a @click.prevent="renderEdit(board)" :href="editBoardLink(board)" title="Manage board">[{{$t("message.Edit")}}]</a>
	</div>
</div>
</template>

<script>
import { renderMixin } from "Mixins";
export default {
	mixins: [renderMixin],
	computed: {
		user_boards() {
			return this.$store.state.user_boards;
		}
	},
	methods: {
		editBoardLink(board) {
			if (config.board_uri_regex.test(board.uri)) {
				return `?:${board.directory}:${board.uri}:edit`;
			}
		},
		//TODO: move to mixin
		boardTarget(board) {
			if (config.board_uri_regex.test(board.uri)) {
				let board_title = board.title ? board.title : "????";
				return `/${board.uri}/ - ${board_title}`;
			}
			return "????";
		},
	}
}
</script>
