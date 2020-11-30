<template>
	<v-container fluid grid-list-md>
	<board-info></board-info>
	<v-layout column align-center>
	<v-flex xs3 text-center>
	<v-btn color="primary" @click="show_create_reply = !show_create_reply">
	{{show_create_reply ? $t("message.Hide") : $t("message.NewThread")}}
	</v-btn>
	<reply-form id='create-form' v-if="show_create_reply">
	<slot slot="submit">{{$t("message.CreateThread")}}</slot>
	</reply-form>
	</v-flex>
	</v-layout>
	<v-layout>
	<v-flex xs10>
	<div id="top-links" class="pt-4">
	<a @click.prevent="renderPage()" :href="boardURI">{{$t("message.Return")}}</a>
	<a href="#bottom-links" @click.prevent="$vuetify.goTo('#bottom-links',scrollOptions)">{{$t("message.Bottom")}}</a>
	<a @click.prevent="search = !search">[{{$t("message.Search")}}]</a>
	</div>
	</v-flex>
	<v-flex xs2 text-xs-right>
	<v-select text-xs-right :items="sort_options" :label="$t('message.SortBy')" v-model='sort_by'></v-select>
	</v-flex>
	</v-layout>
	<v-text-field v-if="search" style="opacity: .8" outlined height='15px' v-model='$store.state.search_thread' :label='$t("message.SearchThread")'></v-text-field>
	<v-divider class='mb-2'/>
	<v-layout column align-center>
	<v-flex xs12 text-center>
	<transition-group name="thread-list" tag="div">
	<catalog-thread class="catalog-thread" v-for="thread in threads" :thread="thread" :key="thread.id"></catalog-thread>
	</transition-group>
	</v-flex>
	</v-layout>
	<v-divider class='mb-2'/>
	<div id="bottom-links">
	<a @click.prevent="renderPage()" :href="boardURI">{{$t("message.Return")}}</a>
	<a @click.prevent="renderHome()" :href="location.pathname">[{{$t("message.Home")}}]</a>
	<a href="#top-links" @click.prevent="$vuetify.goTo('#top-links',scrollOptions)">{{$t("message.Top")}}</a>
	<options></options>
	</div>
	<overlay></overlay>
	</v-container>
</template>

<script>
import BoardInfo from "Board/BoardInfo.vue";
import ReplyForm from "Board/ReplyForm.vue";
import Options from "Board/Options.vue";
import CatalogThread from "Catalog/Thread.vue";
import PostOverlay from "Post/Overlay.vue";
import { renderMixin } from "Mixins";
import { mapState } from "vuex";
	
export default {
	mixins: [renderMixin],
	mounted: function() {
		this._data.sort_by = this.$store.state.local_storage ? this.$store.state.local_storage.catalog_sort : "Bump order";
	},
	components: {
		"board-info": BoardInfo,
		"reply-form": ReplyForm,
		"options": Options,
		"catalog-thread": CatalogThread,
		"overlay": PostOverlay
	},
	data() {
		return {
			show_create_reply: false,
			location: window.location,
			sort_options: Object.keys(config.sortBy).map(key => {return {text: this.$root.$t(`message.${key}`), value: key}}),
			sort_by: null,
			search: false,
			scrollOptions: {duration: 1000}
		};
	},
	watch: {
		sort_by: {
			handler: 'sortBy'
		}
	},
	computed: {
		...mapState([
			"local_storage"
		]),
		boardURI() {
			return `${location.pathname}?:${this.$store.state.directory}:${this.$store.state.uri}:0`;
		},
		threads() {
			return this.$root.allThreads.filter(thread => {
				return !this.local_storage["hidden_threads"]?.includes(thread.id);
			});
		}
	},
	methods: {
		sortBy: function(sortMethod) {
			if (sortMethod in config.sortBy) {
				config.sortBy[sortMethod](this.threads);
				this.saveSortBy(sortMethod);
				return;
			}
			this.saveSortBy(Object.keys(config.sortBy)[0]);
			console.warn(`Unknown sort method: ${sortMethod}`);
		},
		saveSortBy: function(sortMethod) {
			  Millchan.getLocalSettings().then(function(settings) {
			  if (settings == null) {
				settings = {};
			  }
			  settings["catalog_sort"] = sortMethod;
			  Millchan.setLocalSettings(settings);
			});
		}
	}
}
</script>
