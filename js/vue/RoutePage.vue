<template>
	<v-container fluid grid-list-md>
	<board-info></board-info>
	<v-layout column align-center>
	<v-flex xs3 text-center>
	<v-btn color="primary" class="mb-2" @click="$root._data.show_create_reply = !$root._data.show_create_reply">
	{{$root._data.show_create_reply ? $t("message.Hide") : $t("message.NewThread")}}
	</v-btn>
	<reply-form id='create-form' v-if="$root._data.show_create_reply">
	<slot slot="submit">{{$t("message.CreateThread")}}</slot>
	</reply-form>
	</v-flex>
	</v-layout>
	<div id="top-links">
	<a @click.prevent="renderCatalog()" :href="catalogURL">{{$t("message.Catalog")}}</a>
	<a href="#bottom-links" @click.prevent="$vuetify.goTo('#bottom-links',scrollOptions)">{{$t("message.Bottom")}}</a>
	<a @click.prevent="search = !search" href="#bottom-links">[{{$t("message.Search")}}]</a>
	</div>
	<v-text-field v-if='search' style="opacity: .8" outlined height='15px' v-model='$store.state.search_thread' :label='$t("message.SearchThread")'></v-text-field>
	<v-divider/>
	<div-thread v-for="thread in threads" :thread='thread' :key='thread.id' ref='thread'/>
	<navigator/>
	<post-preview v-if='$root.preview_post' :preview_post='$root.preview_post'></post-preview>
	<div id="bottom-links">
	<a @click.prevent="renderHome()" :href="location.pathname">[{{$t("message.Home")}}]</a>
	<a @click.prevent="renderCatalog()" :href="catalogURL">{{$t("message.Catalog")}}</a>
	<a href="#top-links" @click.prevent="$vuetify.goTo('#top-links',scrollOptions)">{{$t("message.Top")}}</a>
	<options></options>
	</div>
	<carousel></carousel>
	<overlay></overlay>
	</v-container>
</template>

<script>
import BoardInfo from "Board/BoardInfo.vue";
import ReplyForm from "Board/ReplyForm.vue";
import Navigator from "Board/Navigator.vue";
import Options from "Board/Options.vue";
import Carousel from "Post/Carousel.vue";
import Thread from "Post/Thread.vue";
import PostPreview from "Post/Preview.vue";
import PostOverlay from "Post/Overlay.vue";
import { renderMixin } from "Mixins";
import { mapGetters } from "vuex";

export default {
	mixins: [renderMixin],
	components: {
		"board-info": BoardInfo,
		"reply-form": ReplyForm,
		"carousel": Carousel,
		"div-thread": Thread,
		"navigator": Navigator,
		"options": Options,
		"post-preview": PostPreview,
		"overlay": PostOverlay
	},
	data() {
		return {
			location: window.location,
			search: false
		};
	},
	computed: {
		...mapGetters([
			"threads"
		]),
		catalogURL() {
			return `${location.pathname}?:${this.$store.state.directory}:${this.$store.state.uri}:catalog`;
		},
		scrollOptions() {
			return {duration: 1000};
		}
	}
}
</script>
