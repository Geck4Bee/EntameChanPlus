<template>
<div class='file-info'>
	<file-menu @updateinfo='updateFileInfo' @deleted='$emit("deleted")' :file='file' :pinned='pinned'></file-menu>
	<a :title='title' :href='validateSource(file.directory,file.original)' @click.prevent='downloadAsOriginal(file)'>{{trimmedFilename(file, 25)}}</a>
	<div v-if='size' class='file-data'> {{bytes2Size(size)}}
		<transition name='shrink'>
			<span style='margin-left: 5px; display: inline-block' v-if='dim'>{{dim}}</span>
		</transition>
	</div>
	<button v-if='!downloading && !downloaded' class='seed' @click='fileDownload(file)' title='Download and seed file'>[Seed]</button>
	<span v-else-if='downloading' class='seed'>{{downloaded_percent.toFixed(0)}}/100%&nbsp;{{peers}} {{peers === 1 ? "peer" : "peers"}}</span>
</div>
</template>

<script>
import { bytes2Size } from "Util";
import { fileMixin } from "Mixins";
import FileMenu from "File/Menu.vue";

export default {
	mixins: [fileMixin],
    props: ["file", "dim"],
    components: {
		"file-menu": FileMenu
	},
    data: function() {
      return {
        bytes2Size: bytes2Size,
        downloading: false,
        downloaded: false,
        pinned: false,
        downloaded_percent: 0,
        peers: 0,
        intervalID: null,
        size: false,
        info: '',
      };
    },
    computed: {
      title: function() {
        let info = `Download with original filename (${this._props.file.name})`;
        if (config.debug) {
          info += '\n';
          Object.keys(this._data.info).forEach(key => {
            info += `\n${key} - ${this._data.info[key]}`
          })
        }
        return info
      }
    },
    methods: {
      trimmedFilename: function(file, limit) {
        if (file.name && file.name.lastIndexOf('.') > limit) {
          return file.name.slice(0, +(file.name.lastIndexOf('.')) + 1 || 9e9).slice(0, limit) + "(...)" + config.mime2ext[file.type];
        } else if (file.name && file.name > limit) {
          return file.name.slice(0, limit) + "(...)" + config.mime2ext[file.type];
        }
        return file.name;
      },
      fileDownload: function(file) {
        this._data.downloading = true;
        return this.requestFile(this.validateSource(file.directory, file.original));
      },
      updateFileInfo: function() {
        if (this._data.intervalID && (this._data.downloaded || this._data.downloaded_percent === 100)) {
          clearInterval(this._data.intervalID);
          this._data.downloading = false;
          this._data.downloaded = true;
          this._data.intervalID = null;
          return;
        }
        return Millchan.cmd("optionalFileInfo", {
          "inner_path": this.validateSource(this._props.file.directory, this._props.file.original)
        }, (info) => {
          var ref;
          if (info) {
            this._data.info = info;
            this._data.pinned = info.is_pinned;
            this._data.downloaded_percent = (ref = info.downloaded_percent) != null ? ref : 0;
            this._data.downloaded = (!info.downloaded_percent && info.is_downloaded) || (info.downloaded_percent === 100);
            if (info.size > 1024 * 1024) {
              this._data.peers = info.peer_seed;
              this._data.downloading = info.is_downloading;
            } else {
              this._data.peers = info.peer;
            }
            return this._data.size = info.size;
          }
        });
      }
    },
    mounted: function() {
      this.updateFileInfo();
      return this._data.intervalID = setInterval((() => {
        return this.updateFileInfo();
      }), 5000);
    },
    beforeDestroy: function() {
      clearInterval(this._data.intervalID)
    }
}
</script>
