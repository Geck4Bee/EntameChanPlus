<template>
	<v-container grid-list-md text-center>
	<create-form>
	<slot slot="hide">{{$t("message.Hide")}}</slot>
	<slot slot="new_board">{{$t("message.NewBoard")}}</slot>
	<slot slot="create">{{$t("message.Create")}}</slot>
	</create-form>
	<disclaimer></disclaimer>
	<v-text-field autocomplete="off" style="opacity: .8" outlined height='15px' v-model='search_board' :label='$t("message.SearchBoard")'></v-text-field>
	<popular-boards :search_board='search_board'></popular-boards>
	<div class="home-container" id="home-recent-posts">
	<posts-batcher :getter="getterRecentPosts">{{ $t("message.RecentPosts") }}</posts-batcher>
	<posts-batcher :getter="getterPinnedPosts">{{ $t("message.PinnedBoards") }}</posts-batcher>
	</div>
	<new-boards></new-boards>
	<user-boards></user-boards>
	</v-container>
</template>

<script>
import { Database } from "Millchan/database";
import CreateForm from "Home/CreateForm.vue";
import Disclaimer from "Home/Disclaimer.vue";
import PopularBoards from "Home/PopularBoards.vue";
import NewBoards from "Home/NewBoards.vue";
import UserBoards from "Home/UserBoards.vue";
import PostsBatcher from "Home/PostsBatcher.vue";
import store from "store";

export default {
	components: {
		"create-form": CreateForm,
		"disclaimer": Disclaimer,
		"popular-boards": PopularBoards,
		"posts-batcher": PostsBatcher,
		"new-boards": NewBoards,
		"user-boards": UserBoards
	},
	data() {
		return {
			search_board: "",
		};
	},
	methods: {
		getterRecentPosts(limit) {
			return Database.getRecentPosts(store.state.local_blacklist.boards, limit)
		},
		getterPinnedPosts(limit) {
			return Database.getRecentPinnedPosts(store.state.pinned_boards, limit)
		}
	}
}
</script>
