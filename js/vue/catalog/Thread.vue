<template>
<div class='catalog-thread'>
	<a @click.prevent="renderThread(thread)" :href='treadlink(thread)' class='thread-link'>
		<div class='post-files'>
			<img v-if='isImage(file.type) && (always_spoiler || (file.spoiler && spoiler_thumbnails))' :width='width' class='static' v-lazy='spoilerImage()' title='Spoiler'/>
			<v-lazy v-else-if='isImage(file.type)'> <img v-lazy='validateImageSrc(file.directory,file.thumb)' :title='getInfo(file)' loading="lazy"/></v-lazy>
			<v-lazy v-else-if='isVideo(file.type) && file.thumb && !always_spoiler'><img :title='getInfo(file)' v-lazy='validateImageSrc(file.directory,file.thumb)' loading="lazy"/></v-lazy>
			<img v-else-if='isVideo(file.type)' :title='getInfo(file)' :width='width' class='static' v-lazy='videoImage()'/>
			<img v-else-if='isAudio(file.type)' :title='getInfo(file)' :width='width' class='static' v-lazy='audioImage()'/>
			<img v-else-if='isDoc(file.type)' :title='getInfo(file)' :width='width' class='static' v-lazy='docImage()'/>
			<img v-else :width='width' class='static' v-lazy='noImage()'/>
		</div>
	</a>
	<div class='thread-stats'>
    <mod-tools :thread="thread"/> /
		<span title='Number of replies'>R: {{thread.replies ? thread.replies.length : 0}}</span> / 
		<span title='Current page'>P: {{calcPage(thread.thread_no)}}</span>
		<span v-if='thread.sticky'>/ sticky</span>
	</div>
	<div class='post-info'>
		<span class='post-subject'>{{trimSubject(thread.subject)}}</span>
	</div>
	<div class='post-body'>
		<blockquote class='post-message' v-html='body'></blockquote>
	</div>
</div>
</template>

<script>
import { postMixin, fileMixin, blMixin, renderMixin } from "Mixins";
import Menu from "Catalog/Menu.vue";

export default {
  components: {
    "mod-tools": Menu
  },
	mixins: [postMixin, fileMixin, blMixin, renderMixin],
    data: function() {
      return {
        width: '160px',
        file: {},
        always_spoiler: config.always_spoiler,
        spoiler_thumbnails: config.spoiler_thumbnails,
      };
    },
    props: ["thread"],
    mounted() {
      this.formatBody(this._props.thread);
    },
    created: function() {
      var parsedFiles;
      parsedFiles = JSON.parse(this.thread.files);
      if (parsedFiles.length) {
        this._data.file = parsedFiles[0];
      }
    },
    methods: {
      treadlink: function(thread) {
        return `?:${thread.directory}:${thread.uri}:${thread.id}`;
      },
      calcPage: function(thread_no) {
        return Math.floor(thread_no / config.threads_per_page) + 1;
      }
    }
}
</script>
