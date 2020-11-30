<template>
<img v-if='blob' class='thumb_preview' :src='blob'>
</template>

<script>
import { fileMixin } from "Mixins";

export default {
	props: ["file"],
    mixins: [fileMixin],
    data: function() {
      return {
        blob: false,
        objectURL: null
      };
    },
    mounted: function() {
      let canvas, video;
      this._data.objectURL = window.URL.createObjectURL(this._props.file);
      if (this.isImage(this._props.file.type)) {
        this._data.blob = this._data.objectURL;
        return;
      }
      if (this.isVideo(this._props.file.type)) {
        canvas = document.createElement("canvas");
        video = document.createElement("video");
        video.preload = "auto";
        canvas.onload = () => {
          this._data.blob = canvas.toDataURL("image/jpeg");
          return
        };
        video.addEventListener("loadedmetadata", () => {
            video.currentTime = config.video_thumbnail_position * video.duration;
        });
        video.addEventListener("error", console.error);
        video.addEventListener("loadeddata", function() {
            canvas.width = this.videoWidth;
            canvas.height = this.videoHeight;
            canvas.getContext("2d").drawImage(this, 0, 0, this.videoWidth, this.videoHeight);
            canvas.onload();
        });
        return video.src = this._data.objectURL;
      }
    },
    destroyed: function() {
      return URL.revokeObjectURL(this._data.objectURL);
    }
}
</script>
