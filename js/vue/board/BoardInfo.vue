<template>
<v-layout column align-center>
<v-flex xs3 text-center>
<div v-if='boardinfo' class='pa-2'>
<a @click.prevent="renderPage()" style="text-decoration:none" :href="boardURI">
<h1 v-if="boardinfo.title" class='boardinfo'>/{{boardinfo.uri|trim(30)}}/ - {{boardinfo.title|trim(100)}}</h1>
<h1 v-else class='boardinfo'>/{{boardinfo.uri|trim(30)}}/</h1>
<h4 v-if='boardinfo.description' class='boardinfo'>{{boardinfo.description|trim(200)}}</h4>
</a>
</div>
</v-flex>
</v-layout>
</template>

<script>
import { renderMixin } from "Mixins";
export default {
	mixins: [renderMixin],
	computed: {
		boardinfo() {
			return this.$store.state.boardinfo;
		},
		boardURI() {
			return `${location.pathname}?:${this.$store.state.directory}:${this.$store.state.uri}:0`;
		}
	}
}
</script>
