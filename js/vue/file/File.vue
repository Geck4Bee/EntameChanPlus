<template>
<span class='div-file' :class='[(isImage(file.type) && !full_image) || (isVideo(file.type) && !embed_video) ? "min-content" : ""]'>
  <template v-if="deleted">
    <img class='static' :src='noImage()' @load='updateHeight()' />
  </template>
  <template v-else>
    <template v-if='isImage(file.type)'>
      <file-info @deleted="deleted = true" :class='{"file-width": !full_image}' :file=file :dim='image_dim'></file-info>
      <a @click.prevent='toggleImage' :href='original'>
        <v-lazy v-if='always_spoiler || (file.spoiler && spoiler_thumbnails && !remove_spoilers)'>
          <img v-if='full_image' v-lazy='original' ref='image' class='full_image' @load='setDimentions()' />
          <img v-else :src='spoilerImage()' class='static' @load='setDimentions()' />
        </v-lazy>
        <v-lazy v-else-if='file.thumb'>
          <img v-if='full_image' v-lazy='original' ref='image' :style='{"max-width": max_width}' class='full_image expand' @load='setDimentions()' />
          <img v-else-if='image_src' :src='image_src' :class='{"playable": isGif(file) && !animate_gifs}' :style='{"max-width": max_width}' @load='setDimentions()' />
          <img v-else v-lazy='thumbnail' ref='image' :class='{"playable": isGif(file) && !animate_gifs}' :style='{"max-width": max_width}' @load='setDimentions()' loading="lazy" />
        </v-lazy>
        <img v-else class='static' :src='noImage()' @load='setDimentions()' />
      </a>
    </template>
    <template v-else-if='isVideo(file.type)'>
      <v-layout row>
        <v-flex xs8>
          <file-info :class='{"file-width": !embed_video}' :file=file></file-info>
        </v-flex>
        <v-flex xs4 v-if='embed_video && video_loaded'>
          <v-btn style='float: right;' small @click='embed_video = video_loaded = false'>{{$t("message.Close")}}</v-btn>
        </v-flex>
      </v-layout>
      <video v-if='embed_video' @volumechange='updateVolume' @loadeddata='afterLoadingMedia' style='max-width: 100%' autoplay controls loop>
        <source :src='original' :type='file.type'>
        Your browser does not support the video tag
      </video>
      <a v-else-if='file.thumb && !always_spoiler' @click.prevent='embed_video = true' :href='original'>
        <v-lazy>
          <img v-lazy='validateImageSrc(file.directory,file.thumb)' class='playable' @load='updateHeight()' loading="lazy" />
        </v-lazy>
      </a>
      <a v-else target='_blank' @click.prevent='embed_video = true' :href='original'>
        <img class='static' v-lazy='videoImage()' @load='updateHeight()' />
      </a>
    </template>
    <template v-else-if='isAudio(file.type)'>
      <file-info class='file-width' :file=file></file-info>
      <div style='display: grid'>
        <a :href='original' @click.prevent='embed_audio = true'>
          <img style='margin: 0 auto; padding: 12px;' class='static' v-lazy='audioImage()' @load='updateHeight()' />
        </a>
        <audio v-if='embed_audio' @volumechange='updateVolume' @loadeddata='afterLoadingMedia' controls>
          <source :src='original' :type='file.type'>
          Your browser does not support the audio tag
        </audio>
      </div>
    </template>
    <template v-else-if='isDoc(file.type)'>
      <file-info class='file-width' :file=file></file-info>
      <a target='_blank' :href='original'>
        <img class='static' v-lazy='docImage()' @load='updateHeight()' />
      </a>
    </template>
  </template>
</span>
</template>

<style scoped>
img.static {
  width: 150px;
  height: 150px;
}

img.expand {
  transition: all 0.5s;
  transform: scale(1.0);
}
</style>

<script>
import Vue from "vue";
import { fileMixin } from "Mixins";
import FileInfo from "File/Info.vue";


export default {
	mixins: [fileMixin],
	components: {
		"file-info": FileInfo
	},
    props: ["file", "remove_spoilers"],
    data: function() {
      return {
        image_dim: '',
        image_src: '',
        full_image: false,
        embed_video: false,
        embed_audio: false,
        video_loaded: false,
        deleted: false,
        always_spoiler: config.always_spoiler,
        spoiler_thumbnails: config.spoiler_thumbnails,
        animate_gifs: config.animate_gifs
      };
    },
    computed: {
      max_width: function() {
        return `${config.media_max_width}px`;
      },
      original: function() {
        return this.validateSource(this._props.file.directory, this._props.file.original);
      },
      thumbnail: function() {
        if (this.isGif(this._props.file) && config.animate_gifs) {
          return this.original;
        } else {
          return this.validateImageSrc(this._props.file.directory, this._props.file.thumb);
        }
      }
    },
    mounted: function() {
      var thumbnail;
      if (this.$store.state.local_storage["pinned"].includes(`${this.$store.state.directory}:${this.$store.state.uri}`)) {
        Millchan.cmd("optionalFileInfo", {
          "inner_path": this.original
        }, (info) => {
          if (info && !info.is_pinned) {
            return Millchan.cmd("optionalFilePin", {
              "inner_path": [this.original]
            });
          }
        });
        if (this._props.file.thumb) {
          thumbnail = this.validateImageSrc(this._props.file.directory, this._props.file.thumb);
          return Millchan.cmd("optionalFileInfo", {
            "inner_path": thumbnail
          }, (info) => {
            if (info && !info.is_pinned) {
              return Millchan.cmd("optionalFilePin", {
                "inner_path": [thumbnail]
              });
            }
          });
        }
      }
    },
    watch: {
      full_image: function(val) {
        return this.$emit("update-expanded", val ? 1 : -1);
      },
      embed_video: function(val) {
        return this.$emit("update-expanded", val ? 1 : -1);
      },
      embed_audio: function(val) {
        return this.$emit("update-expanded", val ? 1 : -1);
      }
    },
    methods: {
      isGif: function(file) {
        return file.type === "image/gif";
      },
      afterLoadingMedia: function(e) {
        if (e.target.tagName === "VIDEO") {
          this._data.video_loaded = true;
        }
        return e.target.volume = this.$store.state.local_storage["config"]["media_volume"];
      },
      updateVolume: function(e) {
        this.$store.state.local_storage["config"]["media_volume"] = Math.min(e.target.volume, 0.95);
        return Millchan.setLocalSettings(this.$store.state.local_storage);
      },
      updateHeight: function() {
		    this.$emit("update-height");
      },
      setDimentions: function() {
        this.updateHeight();
        return this._data.image_dim = this.$refs.image && this._data.full_image && this.$refs.image.naturalWidth * this.$refs.image.naturalHeight > 1 ? ` ${this.$refs.image.naturalWidth}x${this.$refs.image.naturalHeight}` : "";
      },
      toggleImage: function() {
        var coors = this.$el.getBoundingClientRect();
        this._data.image_src = this.thumbnail;
        this._data.full_image = !this._data.full_image;
        if (!this._data.full_image && coors.top < 0) {
          return Vue.nextTick().then(() => {
            return this.$root.$vuetify.goTo(this.$el, {
              duration: 500
            });
          });
        }
      }
    }
}
</script>
