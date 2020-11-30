<template>
<div v-observe-visibility="lazy_load_posts ? is_visible ? false : {callback: visibilityChanged, throttle: adjusted_throttle} : false" v-if='!$store.state.blacklist_active || !$store.getters.isBlackListed(post)' class='reply pa-2' :class='{op : !post.thread, inthread : inthread, blacklisted: $store.getters.isBlackListed(post), selected: selected, invisible: lazy_load_posts && !is_visible}' :id='postID(post)'>
  <template v-if="is_visible || $store.state.thread_limit > 0">
    <div-post-info ref='fileinfo' @all-files='allFiles($event,all_files)' @update-capcode='edit_capcode = $event' @update-subject='edit_subject = $event' @raw-body='edit_body = $event' :editing.sync='editing' :post='post' :inthread='inthread' :slide_images='images' :has_files='all_files.length' />
    <div v-if='files.length' class='files-container'>
      <div-file v-for='(file, i) in files' @update-height='$emit("update-height")' @update-expanded='expanded_files += $event' :file='file' :key='fileKey(file, i)' :remove_spoilers="remove_spoilers"></div-file>
    </div>
    <div style='clear:left' v-if='hidden_files'>
      <a class='file-expand' @click.prevent='updateFileList'>
        {{$tc("message.OmittedFiles", hidden_files, {count: hidden_files})}}
        (<i>{{Math.min(hidden_files,(expanded_times+1)*batch_size)}}</i>)
      </a>
    </div>
    <div v-if='displaying > preview'>
      <a class='file-expand' @click.prevent='hideExpanded()'>{{$t("message.HideExpandedFiles")}}</a>
    </div>
    <div style='clear:both' v-if='files.length > 1 || expanded_files > 0'></div>
    <div class='post-body'>
      <textarea v-if='editing' class='textbody' v-model='edit_body'></textarea>
      <blockquote v-else class='post-message' v-html='body'></blockquote>
    </div>
    <v-btn color='primary' small v-if='editing' @click='editPost(post.id)'>{{$t("message.Edit")}}</v-btn>
    <v-btn color='primary' small v-if='editing' @click='editing=false'>Cancel</v-btn>
    <div v-if='!preview_post && display_replies && (post.thread || inthread)' class='post-replies'>{{$t("message.Replies")}}:
      <span :key="reply_id" v-for='reply_id in replies'>
        <a v-if="reply_id in postsByID" class='cite' :href='linkReply(post, reply_id)' @click.prevent='viewer.routePost(reply_id)' @mouseover='viewer.previewPost($event,reply_id)' @mouseout='viewer.delPreviewPost(reply_id)'>>>{{reply_id.split('-')[0]}}</a>
      </span>
    </div>
    <div-last-edited v-if="post.last_edited" :last_edited="post.last_edited"/>
    <v-snackbar v-model="download_bar" :timeout="download_timeout">
      <a :href="download_link"><h2>Your archive is ready!</h2></a>
      <template v-slot:action="{ attrs }">
      <v-btn v-bind="attrs" @click="download_bar = false">{{$t("message.Close")}}</v-btn>
      </template>
    </v-snackbar>
  </template>
</div>
</template>

<style scoped>
.textbody {
	width: auto;
}
</style>

<script>
const fetchWriter = () => import("@transcend-io/conflux");
import { WebsocketUploader } from "Millchan/uploader.ts";
import { saveFile } from "Util";
import { postMixin, blMixin, fileMixin } from "Mixins";
import { mapState, mapMutations } from "vuex";
import PostInfo from "Post/Info.vue";
import File from "File/File.vue";
import LastEdited from "Post/LastEdited.vue";
import store from "store";

export default {
	mixins: [postMixin, blMixin, fileMixin],
	components: {
		"div-post-info": PostInfo,
    "div-file": File,
    "div-last-edited": LastEdited
	},
    props: ["post", "inthread", "preview_post"],
    data: function() {
      return {
        selected: false,
        hidden_files: 0,
        displaying: 0,
        expanded_times: 0,
        batch_size: config.images_batch,
        preview: config.images_preview,
        editing: false,
        viewer: window.viewer,
        edit_body: "",
        edit_subject: "",
        edit_capcode: false,
        files: [],
        expanded_files: 0,
        replies: [],
        is_visible: false,
        visibility_throttle: config.visibility_throttle,
        lazy_load_posts: config.lazy_load_posts,
        download_bar: false,
        download_link: "",
        download_timeout: config.archive_snackbar_timeout,
        remove_spoilers: false
      };
    },
    computed: {
      ...mapState([
        "replies_by_id"
      ]),
      adjusted_throttle() {
        return this.$store.state.thread_limit == 0 ? 0 : this.visibility_throttle;
      },
      all_files() {
        return JSON.parse(this._props.post.files);
      },
      images() {
        return this.all_files.filter((file) => {
          return this.isImage(file.type);
        });
      },
      display_replies() {
        // filter posts that have been deleted
        return this.replies.filter(reply => reply in this.postsByID).length > 0;
      }
    },
    watch: {
      post(updated, old) {
        if (this.is_visible && updated.body != old.body) {
          this.formatBody(updated);
        }
      }
    },
    updated: function() {
      this.$emit("update-height")
    },
    mounted: function() {
      this.addNewReplyTarget(this._props.post.id);
      this.replies = this.replies_by_id[this._props.post.id];
      this._data.files = this.getFilesPreview();
      this._data.edit_subject = this._props.post.subject;
      this._data.edit_capcode = this._props.post.capcode;
	    if(!this.lazy_load_posts)
	      this.visibilityChanged(true);
    },
    methods: {
      ...mapMutations([
        "addNewReplyTarget"
      ]),
      visibilityChanged(isVisible) {
        if (isVisible && !this.is_visible) {
          this.formatBody(this._props.post);
          this.is_visible = true;
        }
      },
      allFiles: function(action, files) {
        switch (action) {
          case "download":
            return this.downloadAllFiles(files);
          case "request":
            return this.requestAllFiles(files);
          case "remove_spoilers":
            this.remove_spoilers = true;
        }
      },
      requestAllFiles: function(files) {
        var file, i, len1, results;
        results = [];
        for (i = 0, len1 = files.length; i < len1; i++) {
          file = files[i];
          this.requestFile(this.validateSource(file.directory, file.original));
          if (file.thumb) {
            results.push(this.requestFile(this.validateImageSrc(file.directory, file.thumb)));
          } else {
            results.push(void 0);
          }
        }
        return results;
      },
      downloadAllFiles: async function(files) {
        store.dispatch("setProcessing", {is_processing: true, msg: "Archiving files..."});
        // currently there is no way to upload without knowing the total size
        // therefore we need to request all files twice
        // the first one to calculate the size and the second to actually do the upload
        // obviously it would be better if this wasn't necessary
        const { Writer } = await fetchWriter();
        const { readable, writable } = new Writer();
        (async () => {
          const sizeReader = readable.getReader();
          let size = 0;
          while (true) {
              const it = await sizeReader.read();
              if (it.done) break;
              size += it.value.length;
          }
          const { readable: zipReadable, writable: zipWritable } = new Writer();
          (async () => {
            const download = this._props.post.subject ? `${this._props.post.subject}` : `post_${this._props.post.id.split('-')[0]}_${this._props.post.uri}`;
            const inner_path = `data/users/${Millchan.siteInfo.auth_address}/download/${download}.zip`;
            const uploader = new WebsocketUploader(inner_path, size);
            await uploader.start();
            const reader = zipReadable.getReader();
            while (true) {
              const it = await reader.read();
              if (it.done) break;
              await uploader.write(it.value);
            }
            saveFile(download, inner_path);
            store.dispatch("setProcessing", {is_processing: false});
            this.download_link = inner_path;
            this.download_bar = true;
          })();
          (async () => {
            const writer = zipWritable.getWriter();
            await this.zipFiles(writer, files, false);
            writer.close();
          })();
        })();
        (async () => {
          const writer = writable.getWriter();
          await this.zipFiles(writer, files, true);
          writer.close();
        })();
      },
      zipFiles: function(writer, jobs, notify) {
        return new Promise(async resolve => {
          while (true) {
            if (jobs.length == 0) {
              resolve();
              return
            }
            const {name, data} = await this.fetchFileData(jobs[0], notify);
            writer.write({
              name: name,
              lastModified: new Date(0),
              stream: () => new Response(data).body
            })
            jobs = Array.prototype.slice.call(jobs, 1);
          }
        })
      },
      editPost: function(post_id) {
        var updated_post;
        this._data.editing = false;
        updated_post = {
          ...this._props.post,
          id: post_id,
          body: this._data.edit_body,
          subject: this._data.edit_subject,
          capcode: this._data.edit_capcode
        };
        return Millchan.editPost(updated_post);
      },
      fileKey: function(file, i) {
        return `${i}-${file.thumb}-${file.original}`;
      },
      linkReply: function(post, post_id) {
        if (store.state.thread_limit && post_id in this.$store.getters.postsByID) {
          return `?:${post.directory}:${post.uri}:${(post.thread ? post.thread : post.id)}:${store.state.thread_limit}#post-${post_id}`;
        }
        return `?:${post.directory}:${post.uri}:${(post.thread ? post.thread : post.id)}#post-${post_id}`;
      },
      getFilesPreview: function() {
        var parsed;
        parsed = this.all_files;
        this._data.hidden_files = Math.max(0, parsed.length - this._data.preview);
        return parsed.slice(0, config.images_preview);
      },
      getMoreFiles: function(len) {
        this._data.hidden_files = Math.max(0, this.all_files.length - len);
        return this.all_files.slice(0, +len + 1 || 9e9);
      },
      hideExpanded: function() {
        [this._data.displaying, this._data.files] = [this._data.preview, this.getFilesPreview()];
        this._data.expanded_times = 0;
        return this.$root.$vuetify.goTo(this.$refs.fileinfo, this.$root.scrollOptions);
      },
      updateFileList: function() {
        this._data.expanded_times++;
        const new_displaying = this._data.displaying+this._data.expanded_times*config.images_batch;
        [this._data.displaying, this._data.files] = [new_displaying, this.getMoreFiles(new_displaying)];
      }
    }
}
</script>

<style scoped>
.invisible {
  opacity: 0;
  width: 100%;
  height: 20vh;
}
</style>
