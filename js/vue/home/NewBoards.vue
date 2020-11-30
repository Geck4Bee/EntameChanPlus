<template>
<div class="home-container" id="home-new-boards" v-if="new_boards && new_boards.length">
	<span class="home-info">{{ $t("message.NewBoards") }}</span>
	<div v-for="board in new_boards">
	<a @click.prevent="renderPage(board)" :href="board|boardLink">{{boardTarget(board)|trim(100)}}</a>
	</div>
	<v-btn small @click="clearNewboards()">{{ $t("message.Clear") }}</v-btn>
</div>
</template>

<script>
import { renderMixin } from "Mixins";
export default {
	mixins: [renderMixin],
	computed: {
		new_boards() {
			return this.$store.state.new_boards;
		},
	},
	methods: {
		clearNewboards() {
			this.$store.state.new_boards = [];
			this.$store.state.local_storage.popular_boards = {}
			this.$store.state.popular_boards.forEach(board => {
				let board_key  = `${board.directory}:${board.uri}`;
				this.$store.state.local_storage.popular_boards[board_key] = {
					directory: board.directory,
					uri: board.uri,
					title: board.title,
				};
			});
			Millchan.setLocalSettings(this.$store.state.local_storage);
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
