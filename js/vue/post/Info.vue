<template>
<div class='post-info'>
	<span v-if='!editing' class='post-subject'>{{trimSubject(post.subject)}}</span>
	<input v-else class='subject-edit' @input='$emit("update-subject",$event.target.value)' type='text' placeholder='No subject' :value='post.subject' />
	<span v-if='editing && post.directory == $store.state.user_dirs[post.json_id]'>
		<input type='checkbox' :checked='post.capcode' title='Capcode?' @input='$emit("update-capcode",$event.target.checked)'/>
	</span>
	<span v-else-if='post.capcode && post.directory == $store.state.user_dirs[post.json_id] && !editing' class='post-capcode'>## {{$t("message.BoardOwner")}}</span>
	<span v-else :style='{"text-shadow": username_style}' class='post-name'>{{username|trim(100)}}</span>
	<span v-if='isUserPost(post.json_id)'>
		<i>({{$t("message.You")}})</i>
	</span>
	<span class='post-date'>{{post.time|unixTodate}}</span>
	<a v-if='inthread' :href='createlink(post)' @click.prevent='activateQuickReply(post)' class='action'>
		<span v-if='inthread' class='post-id' :id='postNoID(post)'># {{shortID(post)}}</span>
	</a>
	<a v-else @click.prevent="renderThread(post, last_posts)" :href='createlink(post)' class='post-link'>
		<span class='post-id' :id='postNoID(post)'># {{shortID(post)}}</span>
	</a>
	<span v-if='post.sticky' class='sticky'>{{$t("message.Sticky")|lower}}</span>
	<mod-tools @all-files='$emit("all-files",$event)' @raw-body='$emit("raw-body",$event)' :post='post' @update:editing='$emit("update:editing",$event)' :editing.sync='editing' :slide_images='slide_images' :has_files='has_files'></mod-tools>
	<template v-if='!post.thread && !inthread'>
		<a class='reply-link' @click.prevent="renderThread(post)" :href='createlink(post)'>[{{$t("message.Reply")}}]</a>
		<a v-if='post.replies && post.replies.length > last_posts' @click.prevent="renderThread(post, last_posts)" class='reply-link' :href='lastPostsLink(post)'> [{{lastPosts()}}] </a>
	</template>
	<a v-if='inthread && !post.thread && $store.getters.showing_last_posts' class='reply-link' @click.prevent="renderThread(post)" :href='createlink(post)'>[{{$t("message.ShowAll")}}]</a>
</div>
</template>


<script>
const sha1 = require('sha1');
import { postMixin, blMixin, renderMixin } from "Mixins";
import ModTools from "Post/ModTools.vue";
	
export default {
	mixins: [postMixin, blMixin, renderMixin],
	components: {
		"mod-tools": ModTools
	},
    data: function() {
      return {
        last_posts: config.last_posts,
        username_style: null
      };
    },
    props: ["post", "inthread", "editing", "slide_images", "has_files"],
    computed: {
      username: function() {
        var CA, cert, user;
        if (!config.force_anonymous && this._props.post.id in this.$store.state.user_cert_ids) {
          cert = this.$store.state.user_cert_ids[this._props.post.id];
          if (cert && cert.split('@').length === 2) {
            [user, CA] = cert.split('@');
            if (CA !== config.domain.toLowerCase()) {
              this._data.username_style = `1px 1px 3px #${(sha1(cert).slice(0, 6))}`;
              return user;
            } else if (this._props.post.username) {
              return this._props.post.username;
            }
          }
        }
        if (this._props.post.username) {
          return this._props.post.username;
        }
        return this.$root.$t("message.Anonymous");
      }
    },
    methods: {
      lastPosts: function() {
        return this.$tc("message.LastPosts", config.last_posts);
      },
      lastPostsLink: function(thread) {
        return `?:${thread.directory}:${thread.uri}:${thread.id}:${config.last_posts}`;
      },
      createlink: function(post) {
        if (post.thread) {
          return `?:${post.directory}:${post.uri}:${post.thread}#post-${post.id}`;
        }
        return `?:${post.directory}:${post.uri}:${post.id}`;
      },
      activateQuickReply: function(post) {
        var body, new_pos, start;
        let post_id = this.shortID(post);
        this.$root.show_quick_reply = true;
        if (this.$root.$refs.threadRef.$refs.quickreply === void 0) {
          this.$root.selected_post = post_id;
          return this.$root.selected_post_quote = window.getSelection().toString();
        } else {
		      // >.<
          start = this.$root.$refs.threadRef.$refs.quickreply.$refs.textbody.selectionStart;
          body = this.$root.$refs.threadRef.$refs.quickreply.$refs.textbody.value.slice(0, start);
          body += `>>${post_id}\n`;
          body += this.$root.$refs.threadRef.$refs.quickreply.$refs.textbody.value.slice(start);
          this.$root.reply_body = body;
          this.$root.$refs.threadRef.$refs.quickreply.$refs.textbody.value = body;
          new_pos = start + `>>${post_id}\n`.length;
          return this.$root.$refs.threadRef.$refs.quickreply.$refs.textbody.setSelectionRange(new_pos, new_pos);
        }
      }
    }
}
</script>
