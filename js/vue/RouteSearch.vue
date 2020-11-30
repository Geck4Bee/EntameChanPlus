<template>
	<v-container grid-list-md>
	<v-layout column align-center>
	<v-col>
    <v-alert>
        Available operators: <b>file</b>, <b>subject</b>, <b>user</b> and <b>board</b>.
    </v-alert>
    <v-text-field autocomplete="off" style="opacity: .8" outlined height='15px' v-model='search_text' :label='searchDescription'></v-text-field>
    <posts-wrapper :posts="posts" :inthread="false"></posts-wrapper>
    <v-alert type="info" v-if="no_results">
        No results found for: {{last_search}}
    </v-alert>
	</v-col>
	</v-layout>
	<div id="bottom-links">
	<a @click.prevent="renderHome()" :href="location.pathname">[{{$t("message.Home")}}]</a>
	</div>
	</v-container>
</template>

<script>
import { mapState } from "vuex";
import { Database } from "Millchan/database";
import { renderMixin } from "Mixins";
import Wrapper from "Post/Wrapper.vue";
const debounce = require("lodash.debounce");

export default {
    mixins: [renderMixin],
    components: {
        "posts-wrapper": Wrapper,
    },
    watch: {
        processing(processing) {
            if(processing) {
                this.search_text = "";
            }
        },
        search_text: debounce(function(text) {
            let fileFilter, subjectFilter, userFilter, boardFilter, bodyTerms = [];

            text.split(" ").forEach(term => {
                if (term.startsWith("file:")) {
                    fileFilter = term.split("file:")[1];
                    return
                }
                if (term.startsWith("subject:")) {
                    subjectFilter = term.split("subject:")[1];
                    return
                }
                if (term.startsWith("user:")) {
                    userFilter = term.split("user:")[1];
                    return
                }
                if (term.startsWith("board:")) {
                    boardFilter = term.split("board:")[1]
                    return
                }
                bodyTerms.push(term)
            })
            let body = bodyTerms.join(" ");

            Database.searchPosts(body, fileFilter, subjectFilter, userFilter, boardFilter).then(posts => {
                this.posts = posts;
                this.no_results = text !== "" && posts.length == 0;
                this.last_search = text;
            })
        }, 1000)
    },
    computed: {
        ...mapState([
            "processing"
        ]),
        searchDescription() {
            return `${this.$t("message.Search")}...`;
        }
    },
	data() {
		return {
            location: window.location,
            search_text: "",
            last_search: "",
            posts: [],
            no_results: false
		};
	}
}
</script>
