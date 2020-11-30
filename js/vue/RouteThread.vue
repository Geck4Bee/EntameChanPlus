<template>
	<v-container fluid grid-list-md>
	<board-info></board-info>
	<v-layout column align-center>
	<v-flex xs3 text-center>
	<v-btn color="primary" class="mb-2" v-if="!$root._data.show_quick_reply" @click="$root._data.show_create_reply = !$root._data.show_create_reply">
	{{$root._data.show_create_reply ? $t("message.Hide") : $t("message.ReplyToThread")}}
	</v-btn>
	<reply-form id='create-form' v-if="$root._data.show_create_reply && !$root._data.show_quick_reply">
	<slot slot="submit">{{$t("message.Reply")}}</slot>
	</reply-form>
	</v-flex>
	</v-layout>
	<div id="top-links">
	<a @click.prevent="renderPage()" :href="boardURI">{{$t("message.Return")}}</a>
	<a @click.prevent="renderCatalog()" :href="catalogURL">{{$t("message.Catalog")}}</a>
	<a href="#bottom-links" @click.prevent="$vuetify.goTo('#bottom-links',scrollOptions)">{{$t("message.Bottom")}}</a>
	</div>
	<vue-draggable-resizable v-if="$root._data.show_quick_reply" :z="20" h="auto" w="auto" :x="startX()" style="position: fixed" :drag-cancel="nodragClass">
	<reply-form id='quick-reply' ref="quickreply" addclose="true">
	<slot slot="submit">{{$t("message.Reply")}}</slot>
	</reply-form>
	</vue-draggable-resizable>
	<posts-wrapper ref='replies' :posts="posts" :inthread="true"></posts-wrapper>
	<post-preview v-if='$root.preview_post' :preview_post='$root.preview_post'></post-preview>
	<div id="bottom-links">
	<a @click.prevent="renderPage()" :href="boardURI">{{$t("message.Return")}}</a>
	<a @click.prevent="renderHome()" :href="location.pathname">[{{$t("message.Home")}}]</a>
	<a @click.prevent="renderCatalog()" :href="catalogURL">{{$t("message.Catalog")}}</a>
	<a href="#top-links" @click.prevent="$vuetify.goTo('#top-links',scrollOptions)">{{$t("message.Top")}}</a>
	<a v-if="!$root._data.show_quick_reply" @click.prevent="$root._data.show_quick_reply=true">[{{$t("message.Reply")}}]</a>
	<options></options>
	</div>
	<carousel></carousel>
	<overlay></overlay>
	</v-container>
</template>

<script>
import BoardInfo from "Board/BoardInfo.vue";
import ReplyForm from "Board/ReplyForm.vue";
import Options from "Board/Options.vue";
import Carousel from "Post/Carousel.vue";
import PostPreview from "Post/Preview.vue";
import Wrapper from "Post/Wrapper.vue";
import PostOverlay from "Post/Overlay.vue";
import VueDraggableResizable from "vue-draggable-resizable";
import { renderMixin } from "Mixins";
	
export default {
	mixins: [renderMixin],
	components: {
		"board-info": BoardInfo,
		"reply-form": ReplyForm,
		"carousel": Carousel,
		"options": Options,
		"post-preview": PostPreview,
		"posts-wrapper": Wrapper,
		"overlay": PostOverlay,
		"vue-draggable-resizable": VueDraggableResizable
	},
	data() {
		return {
			draggableDisplay: "fixed",
			location: window.location,
			nodragClass: ".no-drag",
			scrollOptions: {duration: 1000},
			mheight: 500,
			mwidth: 350,
		};
	},
	computed: {
		boardURI() {
			return `${location.pathname}?:${this.$store.state.directory}:${this.$store.state.uri}:0`;
		},
		catalogURL() {
			return `${location.pathname}?:${this.$store.state.directory}:${this.$store.state.uri}:catalog`;
		},
		posts() {
			return this.$store.state.posts;
		}
	},
	methods: {
		startX() {
			return document.documentElement.scrollWidth - 450;
		},
		startY() {
			return document.documentElement.clientHeight - 550
		}
	}
}
</script>
