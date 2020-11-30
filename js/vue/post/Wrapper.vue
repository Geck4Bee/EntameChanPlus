<template>
<div class='posts_wrapper'>
<div-post v-for='post in posts' :ref='postID(post)' :inthread='inthread' :key='post.id' :post='post'></div-post>
</div>
</template>

<script>
import Vue from "vue";
import Post from "Post/Post.vue";
import { postMixin } from "Mixins";
import { mapState, mapMutations } from "vuex";
	
export default {
    mixins: [postMixin],
    props: ["posts", "inthread"],
    components: {
      "div-post": Post
    },
    data() {
      return {
        last_url: null
      }
    },
    computed: {
      ...mapState([
        "url_hash",
        "active_page"
      ])
    },
    updated() {
        if (this.active_page !== "thread") {
          return
        }
        //Workaround to make url hash redirection work
        Vue.nextTick(() => {
          setTimeout(() => {
            if (this.last_url == this.url_hash) {
              return
            }
            if(this.url_hash) {
              let postSelector = this.url_hash;
              let target = this.$refs[postSelector.slice(1)];
              if (target) {
                let post = target[0];
                this.$vuetify.goTo(post, {duration: 0});
                post._data.selected = true;
                this.last_url = this.url_hash;
              }
            } else {
              Millchan.cmd("wrapperInnerLoaded");
            }
          }, 1000)
        });
    }
}
</script>
