import { lazyLoad, bytes2Size, fetchAndSaveFile, formatTime } from "Util";
import { mapState, mapGetters } from "vuex";
import store from "store";
import Vue from "vue";

import hljs from "highlight.js/lib/highlight";
import javascript from 'highlight.js/lib/languages/javascript';
import cpp from 'highlight.js/lib/languages/cpp';
import python from 'highlight.js/lib/languages/python';
import shell from 'highlight.js/lib/languages/shell';
import json from 'highlight.js/lib/languages/json';
import java from 'highlight.js/lib/languages/java';
import { decode } from "base64-arraybuffer";

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('python', python);
hljs.registerLanguage('shell', shell);
hljs.registerLanguage('json', json);
hljs.registerLanguage('java', java);

export const postMixin = {
    computed: {
        ...mapState([
        "user_json_id",
        "threads_by_id",
        "thread_limit",
        "active_page"
      ]),
      ...mapGetters([
        "postsByID"
      ])
    },
    data: function() {
      return {
        body: this.$t("message.Loading")
      }
    },
    watch: {
      body() {
        if (config.highlight_code && this.$el.querySelectorAll) {
          Vue.nextTick(() => {
            this.$el.querySelectorAll('pre').forEach((block) => {
              block.innerHTML = block.innerHTML.replace(/<br>/g, "\n");
              hljs.highlightBlock(block);
            })
          })
        }
      }
    },
    methods: {
      postID: function(post) {
        return `post-${post.id}`
      },
      postNoID: function(post) {
        return `postno-${post.id}`
      },
      shortID: function(post) {
        return post.id.split('-')[0];
      },
      trimSubject: function(subject) {
        if (subject) {
          return subject.slice(0, config.max_subject_length);
        } else {
          return null;
        }
      },
      ID2cite: function(post, body, raw = false) {
        var id_regex;
        if (raw) {
          id_regex = />>(\w{8}-\w{4}-\w{4}-\w{4}-\w{12})/g;
        } else {
          id_regex = /&gt;&gt;(\w{8}-\w{4}-\w{4}-\w{4}-\w{12})/g;
        }
        if (body) {
          body = body.replace(id_regex, (match, cite) => {
            var mention;
            if (this.active_page == "home") {
              return `<a href="#">>>${cite.split('-')[0]}</a>`;
            } else {
              if (post && this.active_page == "thread") {
                viewer.addReply(post.id, cite);
              }
              if (raw) {
                return `>>${cite.split('-')[0]}`;
              }
              mention = `<a class='cite' onmouseover='viewer.previewPost(event,"${cite}")' onmouseout='viewer.delPreviewPost("${cite}")' href="#" onclick='event.preventDefault(); viewer.routePost("${cite}");'>>>${cite.split('-')[0]}`;
              if ((cite in this.postsByID && !this.postsByID[cite].thread) || (cite in this.threads_by_id && !this.threads_by_id[cite].thread)) {
                mention += ' (OP)';
              }
              if (config.show_mention && ((cite in this.postsByID && this.postsByID[cite].json_id === this.user_json_id) || (cite in this.threads_by_id && this.threads_by_id[cite].json_id === this.user_json_id))) {
                mention += ` (${this.$t("message.You")})`;
              }
              mention += '</a>';
              return mention;
            }
          });
        }
        return body;
      },
      formatBody: function(post) {
        formatWorkerManager.doWork({
          body: post.body,
          max_body_length: config.max_body_length,
          origin: window.location.origin
        },
        this,
        post);
      },
      isUserPost: function(json_id) {
        return this.$store.state.user_json_id === json_id;
      }
    }
  };

 export const fileMixin = {
    data: function() {
      var data;
      data = {
        loading: true,
        error: false
      };
      return data;
    },
    directives: {
      lazy: {
        update(el, binding) {
          if (binding.value === binding.oldValue) {
            return
          }
          lazyLoad(el, binding.value);
        },
        bind(el, binding) {
          lazyLoad(el, binding.value);
        }
      }
    },
    methods: {
      noImage: function() {
        return config.default_404_image;
      },
      spoilerImage: function() {
        return config.default_spoiler_image;
      },
      videoImage: function() {
        return config.default_video_image;
      },
      docImage: function() {
        return config.default_doc_image;
      },
      audioImage: function() {
        return config.default_audio_image;
      },
      isImage: function(mimetype) {
        return config.allowed_image_mimetype.includes(mimetype);
      },
      isVideo: function(mimetype) {
        return config.allowed_video_mimetype.includes(mimetype);
      },
      isAudio: function(mimetype) {
        return config.allowed_audio_mimetype.includes(mimetype);
      },
      isDoc: function(mimetype) {
        return config.allowed_doc_mimetype.includes(mimetype);
      },
      getInfo: function(file) {
        return `Filename: ${file.name}\nSize: ${bytes2Size(file.size)}\nType: ${file.type}`;
      },
      validateImageSrc: function(dir, src) {
        var source;
        source = `data/users/${dir}/${src}`;
        if (config.image_src_regex.test(source)) {
          return source;
        } else {
          console.warn(`Src '${source}' doesn't match whitelisted src regex`);
          return config.default_error_image;
        }
      },
      validateSource: function(dir, anchor) {
        var source;
        source = `data/users/${dir}/src/${anchor}`;
        if (config.media_source_regex.test(source)) {
          return source;
        } else {
          console.warn(`Anchor '${source}' doesn't match whitelisted anchor regex`);
          return config.default_error_image;
        }
      },
      downloadAsOriginal: function(file) {
        return Millchan.cmd("fileGet", {
          "inner_path": this.validateSource(file.directory, file.original),
          "required": true,
          "format": "base64"
        }, (b64data) => {
          var data;
          if (b64data && b64data.length) {
            data = `data:${file.type};base64,${b64data}`;
            return fetchAndSaveFile(file.name, data);
          }
        });
      },
      fetchFileData: function(file, notify=false) {
        return new Promise((resolve) => {
          return Millchan.cmd("fileGet", {
            "inner_path": this.validateSource(file.directory, file.original),
            "required": true,
            "format": "base64"
          }, (b64data) => {
            let data;
            if (b64data) {
              data = decode(b64data)
            } else {
              data = "";
              if (notify) Millchan.error(`failed to download <b>${file.name}</b>`);
            }
            resolve({
              data: data,
              name: file.name
            });
          });
        });
      },
      requestFile: function(file_path) {
        return Millchan.cmd("optionalFileInfo", {
          "inner_path": file_path
        }, (info) => {
          if (info && !info.error) {
            if (info.size > 1024 * 1024) { //Big file
              file_path += "|all";
            }
            return Millchan.cmd("fileNeed", {
              "inner_path": file_path
            }, (ok) => {
                console.debug(ok);
            });
          }
        });
      }
    }
  };

  export const blMixin = {
    props: ["bl_users", "bl_posts"],
    methods: {
      blacklistPost: function(post) {
        return Millchan.modAction(config.action.BL_POST, post.uri, post.id);
      },
      blacklistUser: function(post) {
        return Millchan.modAction(config.action.BL_USER, post.uri, this.$store.state.user_dirs[post.json_id]);
      },
      undoBlacklistPost: function(uri, post_id) {
        return Millchan.modAction(config.action.UNDO_BL_POST, uri, post_id);
      },
      undoBlacklistUser: function(uri, directory) {
        return Millchan.modAction(config.action.UNDO_BL_USER, uri, directory);
      },
      isInUserBlacklist: function(post) {
        return this.$store.getters.isInUserBlacklist(post);
      },
      isInPostBlacklist: function(post) {
        return this.$store.getters.isInPostBlacklist(post);
      },
      isBlackListed: function(post) {
        return this.$store.getters.isBlackListed(post);
      }
    }
  };

  export const filterMixin = {
    methods: {
      isBlacklisted: function(directory, uri) {
        var blacklisted_board, i, len1, ref;
        if (this.$store.state.local_blacklist.boards) {
          ref = this.$store.state.local_blacklist.boards;
          for (i = 0, len1 = ref.length; i < len1; i++) {
            blacklisted_board = ref[i];
            if (`${directory}:${uri}` === blacklisted_board) {
              return true;
            }
          }
        }
        return false;
      },
      filter: function(boards) {
        return boards.filter((board) => {
          return !this.isBlacklisted(board.directory, board.uri);
        });
      }
    }
  };

  export const timerMixin = {
	  data: function() {
		  return {
        time: null,
        intervalID: null,
        startTime: null,
      };
	  },
	  computed: {
      transTime: function() {
        let time = this._data.time;
        if (time) {
          return time.value < 0 ? this.$t("message.Now") : this.$tc(`message.${time.type}`, time.value);
        }
        return "???";
      }
    },
	  methods: {
      startTimer: function(startTime, interval) {
        if(startTime === this._data.startTime) {
          return;
        }
        this._data.startTime = startTime;
        this._data.time = formatTime(startTime)
        if (this._data.intervalID) {
          clearInterval(this._data.intervalID);
        }
        this._data.intervalID = setInterval((() => {
          this._data.time = formatTime(startTime)
        }), interval);
		  }
    },
    beforeDestroy: function() {
      clearInterval(this._data.intervalID);
    }
  };

export const renderMixin = {
  methods: {
    renderHome: function() {
      store.commit("clearSearch")
      store.commit("setAllThreads", [])
      store.commit("setThreads", [])
      store.commit("setPosts", [])
      Millchan.cmd("wrapperPushState", [{"search":""}, "Millchan", ""])
      Millchan.cmd("wrapperSetTitle", "EntameChanPlus - ZeroNet");
      Millchan.routes["home"](null, this.$store.state.local_storage);
      this.$vuetify.goTo(0, {duration: 0})
    },
    renderPage: function(board=this.currentBoard()) {
      store.commit("clearSearch")
      if (config.default_to_catalog) {
        this.renderCatalog(board)
        return
      }
      let search = `:${board.directory}:${board.uri}:0`,
          match = [board.directory, board.uri, "0"];
      Millchan.cmd("wrapperPushState", [{search}, "", search])
      Millchan.routes["page"](match, this.$store.state.local_storage)
      this.$vuetify.goTo(0, {duration: 0})
    },
    renderCatalog: function(board=this.currentBoard()) {
      store.commit("clearSearch")
      let search = `:${this.$store.state.directory}:${this.$store.state.uri}:catalog`,
        match = [board.directory, board.uri];
      Millchan.cmd("wrapperPushState", [{search}, "", search])
      Millchan.routes["catalog"](match, this.$store.state.local_storage)
      this.$vuetify.goTo(0, {duration: 0})
    },
    renderThread: function(post, last_posts=false) {
      store.commit("clearSearch")
      store.commit("setPosts", [])
      let search, match;
      if (post.thread) {
        search = last_posts ? `:${post.directory}:${post.uri}:${post.thread}:${last_posts}#post-${post.id}` : `:${post.directory}:${post.uri}:${post.thread}#post-${post.id}`;
        match = [post.directory, post.uri, post.thread, last_posts];
        store.commit("setURLHash", `#post-${post.id}`)
      } else {
        search = last_posts ? `:${post.directory}:${post.uri}:${post.id}:${last_posts}` : `:${post.directory}:${post.uri}:${post.id}`;
        match = [post.directory, post.uri, post.id, last_posts];
        store.commit("setURLHash", false)
      }
      Millchan.cmd("wrapperPushState", [{search}, "", search])
      Millchan.routes["thread"](match, this.$store.state.local_storage)
    },
    renderEdit: function(board) {
      let search = `:${board.directory}:${board.uri}:edit`,
        match = [board.directory, board.uri];
      Millchan.cmd("wrapperPushState", [{search}, "", search])
      Millchan.routes["edit"](match, this.$store.state.local_storage)
      this.$vuetify.goTo(0, {duration: 0})
    },
    renderBlacklist: function(board=this.currentBoard()) {
      let search = `:${board.directory}:${board.uri}:blacklist`,
        match = [board.directory, board.uri];
      Millchan.cmd("wrapperPushState", [{search}, "", search])
      Millchan.routes["blacklist"](match, this.$store.state.local_storage)
      this.$vuetify.goTo(0, {duration: 0})
    },
    renderSearch: function() {
      let search = `search`;
      Millchan.cmd("wrapperPushState", [{search}, "", search])
      Millchan.routes["search"]();
      this.$vuetify.goTo(0, {duration: 0})
    },
    currentBoard() {
			return {
				directory: this.$store.state.directory,
				uri: this.$store.state.uri
			};
		},
  }
}

export const MenuMixin = {
  computed: {
    ...mapState([
      "user_dirs"
    ])
  },
  methods: {
    muteUser: function(post) {
      var auth_address, user_dir;
      user_dir = this.user_dirs[post.json_id];
      auth_address = user_dir.split('/')[1];
      Millchan.killUser(auth_address, user_dir);
    },
    deletePost: function(post) {
      var user_dir;
      user_dir = this.user_dirs[post.json_id];
      Millchan.deletePost(post, user_dir);
    },
    stickThread: function(post) {
      Millchan.modAction(config.action.STICK, post.uri, post.id);
    },
    unstickThread: function(post) {
      Millchan.modAction(config.action.UNDO_STICK, post.uri, post.id);
    },
    followThread: function(post) {
      Millchan.followThread(post.id)
    },
    unfollowThread: function(post) {
      Millchan.unfollowThread(post.id);
    }
  }
}