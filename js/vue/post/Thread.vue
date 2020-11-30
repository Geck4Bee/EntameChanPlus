<template>
<div>
<div v-if="isHidden(thread)" class="my-2 font-italic subtitle-2 hidden_thread">
  {{$t("message.HiddenThread")}} ({{thread.replies ? thread.replies.length : 0}}) <a class="pl-1" :title="title" @click.prevent="unhideThread(thread)"># {{shortID(thread)}}</a>
</div>
<div v-else class='posts_wrapper'>
<div-post :post='thread' :key='thread.id'/>
<div v-if='hidden'> <a class='toggle-replies' @click.prevent='changeDisplay'> {{ omittedMessage() }} </a> </div>
<div-post v-for='reply in display' :key='reply.id' :post='reply' :ref='reply.id' />
</div>
<v-divider class='my-2'/>
</div>
</template>

<script>
import { postMixin, blMixin } from "Mixins";
import Post from "Post/Post.vue";
import { mapState } from "vuex";
	
export default {
	mixins: [postMixin, blMixin],
	components: {
		"div-post": Post
	},
    props: ["thread"],
    data: function() {
      var data;
      data = {
        display: [],
        hidden: 0,
        all_replies: false
      };
      return data;
    },
    computed: {
      ...mapState([
        "local_storage"
      ]),
      blacklist_active() {
        return this.$store.state.blacklist_active;
      },
      title() {
        let title = "Click to display it"
        if (this.thread.subject) {
          title += ` (${this.thread.subject})`
        }
        return title
      }
	},
    methods: {
      unhideThread: function(thread) {
          this.local_storage[`hidden_threads`] = this.local_storage[`hidden_threads`].filter(hidden_thread => {
            return hidden_thread != thread.id
          })
          Millchan.setLocalSettings(this.local_storage, () => {
            Millchan.urlRoute();
          });
      },
      isHidden: function(thread) {
        return this.local_storage["hidden_threads"].includes(thread.id);
      },
      updateDisplay: function() {
        var display = this._props.thread.replies ? this._props.thread.replies : [];
        if (this.$store.state.blacklist_active) {
          display = display.filter((reply) => {
            return !this.isBlackListed(reply);
          });
        }
        if (this._data.all_replies) {
          return this._data.display = display;
        } else {
          this._data.display = display.slice(-config.posts_preview);
          return this._data.hidden = display.length - this._data.display.length;
        }
      },
      changeDisplay: function() {
        if (this._data.display.length === this._props.thread.replies.length) {
          this._data.display = this._data.display.slice(-config.posts_preview);
        } else {
          this._data.display = this._props.thread.replies;
        }
        return this._data.all_replies = !this._data.all_replies;
      },
      omittedMessage: function() {
        if (!this._data.all_replies) {
          return this.$tc("message.OmittedPosts", this._data.hidden);
        } else {
          return this.$t("message.HideExpandedReplies");
        }
      }
    },
    watch: {
      blacklist_active: {
        handler: 'updateDisplay'
      },
      thread: {
        handler: 'updateDisplay',
        immediate: true
      }
    }
}
</script>
