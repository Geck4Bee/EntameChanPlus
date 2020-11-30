<template>
	<v-layout column align-center>
	<v-flex xs3 text-center>
	<form @submit.prevent='submitPost'>
	<input type='hidden' id='post_dir' :value='directory'/>
	<input type='hidden' id='post_uri' :value='uri'/>
	<input type='hidden' id='post_thread' :value='thread'/>
	<template v-if='$root.reply_body.length'>
		<v-btn small v-if='!preview' @click='preview = true'>{{$t("message.Preview")}}</v-btn>
		<v-btn depressed v-else @click='preview = false'>{{$t("message.Preview")}}</v-btn>
	</template>
	<v-btn small v-if='addclose' @click='close'>{{$t("message.Close")}}</v-btn>
	<div class='no-drag text-start' v-if='$store.state.is_user_board'>
		<span class='subheading blue-grey--text'>Capcode</span>
		<input class='ml-3' type='checkbox' id='post_capcode'/>
	</div>
	<v-text-field v-if='show_username' autocomplete='off' :label='$t("message.Username")' id='post_username' v-model='$store.state.username'/>
	<v-text-field autocomplete='off' :label='$t("message.Subject")' id='post_subject'/>
	<textarea class='no-drag textbody' v-if='!preview' v-model='$root.reply_body' ref='textbody' :maxlength='maxlength'></textarea>
	<blockquote v-else class='pa-2 text-start reply-preview no-drag' v-html='ID2cite(null, formatter($root.reply_body), false)'></blockquote>
	<div style='font-size:11px;'>{{$root.reply_body.length}}/{{maxlength}}</div>
	<div class='filearea text-center my-2'>
		<div @click='clicked' @drop.prevent='dropped' @dragover='$event.preventDefault()' id="custom_post_files">
		{{$t("message.DragAndDropFiles")}}
		</div>
		<input @change='updateFilelist($event.target.files)' ref='images' type='file' id='post_files' :accept='allowed_mimetype()' multiple />
	</div>
	<div v-if='files.length' id='files-container' class='my-2'>
		<div :class='[isImage(file.type) ? "selected_image" : "selected_file"]' v-for='file in files' :key='fileKey(file)'>
			<input v-if='isImage(file.type)' @change='file.spoiler = $event.target.checked' type='checkbox' :checked='file.spoiler' title='Spoiler?' />
			<button class='action' title='Remove file' @click.prevent='removeFile(file)'>[X]</button>
			<file-blob v-if='isImage(file.type) || isVideo(file.type)' :file='file'></file-blob>
			<span :title='file.name'>{{file.name|trim(20)}}</span>
		</div>
	</div>
	<v-spacer></v-spacer>
	<user-cert :userid='userid'></user-cert>
	<v-spacer></v-spacer>
	<v-btn :disabled="submitted" color='primary' type='submit'>
	<slot name='submit'></slot>
	</v-btn>
	</form>
	</v-flex>
	</v-layout>
</template>

<script>
import { postMixin, fileMixin } from "Mixins";
import { fileUniqueKey, fileInArray, formatter } from "Util";
import { mapState } from "vuex";
import UserCert from "Common/UserCert.vue";
import FileBlob from "File/Blob.vue";

export default {
	props: ['addclose'],
	components: {
		"user-cert": UserCert,
		"file-blob": FileBlob
	},
	computed: {
		...mapState([
			"userid",
			"directory",
			"uri",
			"thread"
		])
	},
    mixins: [postMixin, fileMixin],
    data: function() {
      return {
		formatter,
        files: [],
        maxlength: config.max_body_length,
        preview: false,
		show_username: true,
		submitted: false,
      };
    },
    methods: {
	  clicked: function(e) {
		this.$refs.images.click();
	  },
	  dropped: function(e) {
		  var files = [];
		  for (var i = 0; i < e.dataTransfer.items.length; i++) {
			 files.push(e.dataTransfer.items[i].getAsFile());
		  };
		  this.updateFilelist(files);
	  },
      fileKey: function(file) {
        return fileUniqueKey(file);
      },
      updateFilelist: function(files) {
        var file, i, len1;
        if (files) {
          for (i = 0, len1 = files.length; i < len1; i++) {
            file = files[i];
            if (!fileInArray(file, this._data.files)) {
              this._data.files.push(file);
            }
          }
          return this.$refs.images.value = '';
        }
      },
      removeFile: function(file) {
        return this._data.files.splice(this._data.files.indexOf(file), 1);
      },
      submitPost: function() {
		this.submitted = true;
        return Millchan.makePost(this._data.files, this.$root.reply_body);
      },
      allowed_mimetype: function() {
        return config.allowed_mimetype.join(',');
      },
      selectUser: function() {
        return Millchan.selectUser();
      },
      close: function() {
        return this.$root._data.show_quick_reply = false;
      },
      updateFormFields: function() {
        if (this.userid) {
          var [user, CA] = this.userid.split('@');
          this._data.show_username = CA === config.domain.toLowerCase();
        }
      }
    },
    mounted: function() {
      //Quote post used to open box
      if (this.$root.selected_post) {
        this.$root.reply_body += `>>${this.$root.selected_post}\n`;
        if (this.$root.selected_post_quote.length) {
          this.$root.reply_body += `>${this.$root.selected_post_quote}\n`;
          this.$root.selected_post_quote = "";
        }
        return this.$root.selected_post = false;
      }
    },
    watch: {
      userid: {
        handler: 'updateFormFields',
        immediate: true
      }
    }
}
</script>
