<template>
<div v-if="posts.length">
<span class="home-info">
<slot></slot>
</span>
<div class="recent-posts" :style="style">
<recent-post v-for='post in display' :key='post.id' :post='post'></recent-post>
</div>
<v-btn small :disabled="loading" class='recent-button' v-if='hasMore()' @click='display_len += (display_len/start_len)*start_len'>
{{ loading ? $t("message.Loading") : $t("message.LoadMore") }}
</v-btn>
<br>
<v-btn small :disabled="loading" class='recent-button' v-if='display_len > start_len' @click='display_len = start_len'>
{{ $t("message.HideExpanded") }}
</v-btn>
</div>
</template>

<style>
.recent-posts .recent-link::after {
  counter-increment: var(--count) -1;
  content: " " counter(var(--count));
  font-style: italic;
  font-size: 15px;
}

.recent-link {
  transition: transform .2s;
  display: inline-block;
}

.recent-link:hover {
  --scale: 1.1;
  transform: scale(var(--scale));
  -webkit-transform: scale(var(--scale));
  -moz-transform: scale(var(--scale));
  -o-transform: scale(var(--scale));
  -ms-transform: scale(var(--scale));
}
</style>

<script>
import RecentPost from "./RecentPost.vue";
import { mapState, mapGetters } from 'vuex';

export default {
    props: ["getter"],
    components: {
		  "recent-post": RecentPost
    },
    data() {
      return {
        start_len: config.recent_posts,
        display_len: config.recent_posts,
        display: [],
        posts: [],
        loading: false
      };
    },
    computed: {
      ...mapState([
        "popular_boards",
        "pinned_boards"
      ]),
      ...mapGetters([
        "totalPostsByBoard"
      ]),
      style() {
        let boards = this.display.reduce((acc, post) => {
          let id = `${post.directory}:${post.uri}`;
          if (!(id in acc)) acc[id] = this.totalPostsByBoard[id] + 1;
          return acc;
        }, {});
        return {
          "counter-reset": Object.keys(boards).map(board => {
            let id = board.replace('/', '-').replace(':','-');
            return `counter-${id} ${boards[board]}`;
          }).join(" ")
        };
      }
    },
    watch: {
      display_len(new_limit, old_limit) {
        if (new_limit < old_limit) {
          this.display = this.posts.slice(0, new_limit);
        } else {
          this.loading = true;
          this.fetchMorePosts(new_limit).then(() => {
            this.loading = false;
          })
        }
      },
      pinned_boards() {
        this.fetchMorePosts(this.display_len)
      },
      popular_boards() {
        this.fetchMorePosts(this.display_len)
      }
    },
    methods: {
      hasMore() {
        return this.display.length < config.max_recent_posts;
      },
      fetchMorePosts(limit) {
        return new Promise(resolve => {
          this._props.getter(limit).then(recent_posts => {
            this.posts = recent_posts;
            this.display = this.posts.slice(0, limit);
            resolve()
          })
        })
      }
    }
}
</script>
