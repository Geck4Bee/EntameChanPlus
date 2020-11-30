<template>
<div>
  <div class='recent-post' :style="count">
  <span @mouseover='showPreview' @mouseout ='show_preview = false' class='recent-link'>
  <a  @click.prevent="renderThread(post, last_posts)" :href='postLink(post)'>{{shortDisplay(post)}}</a>
  </span>
  <span :title='getLocale(post)' class='recent-time'>{{transTime}}</span>
  </div>
  <transition name="fade">
    <post-preview v-if='show_preview' :preview_post='post'></post-preview>
  </transition>
</div>
</template>

<style scoped>
.fade-enter-active {
  transition: opacity .3s;
}
.fade-enter, .fade-leave-to, .fade-leave-active, .fade-enter-active {
  opacity: 0;
}
</style>

<script>
import { mapGetters } from "vuex";
import { timerMixin, renderMixin } from "Mixins";
import PostPreview from "Post/Preview.vue";

export default {
	mixins: [timerMixin, renderMixin],
	props: ["post"],
	components: {
		"post-preview": PostPreview
  },
  computed: {
    count() {
      let id = `counter-${this.post.directory}:${this.post.uri}`.replace('/', '-').replace(':','-');
      return {
        "--count": id
      };
    }
  },
    data: function() {
      return {
        show_preview: false,
        post_x: null,
        post_y: null,
        time: null,
        timer: null,
        last_posts: config.last_posts
      };
    },
    mounted: function() {
		  this.startTimer(this._props.post.time, 5000);
    },
    methods: {
      showPreview: function(event) {
        this.$root.previewX = event.clientX;
        this.$root.previewY = event.clientY;
        return this.show_preview = true;
      },
      postLink: function(post) {
        return `?:${post.directory}:${post.uri}:${(post.thread ? post.thread : post.id)}:${config.last_posts}#${post.id}`;
      },
      shortDisplay: function(post) {
        return `>>>/${post.uri}/`;
      },
      getLocale: function(post) {
        var time = new Date(post.time);
        return time.toLocaleString();
      }
    }
}
</script>
