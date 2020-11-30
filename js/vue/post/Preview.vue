<template>
<div-post :key='preview_post.id' @update-height='updateHeight' class='post_preview' ref='post_preview' :style='{left: post_x + "px", top: post_y + "px"}' preview_post='true' :post='preview_post' />
</template>

<script>
import Post from "Post/Post.vue";

export default {
	props: ["preview_post" ],
	components: {
		"div-post": Post
	},
  data: function() {
    return {
      post_x: 0,
      post_y: 0
    };
  },
  mounted: function() {
    this._data.post_x = this.$root.previewX;
    this._data.post_y = this.$root.previewY;
  },
  updated: function() {
    this.updateHeight();
  },
  methods: {
		updateHeight: function() {
			var coors = this.$el.getBoundingClientRect();
			const bottomMargin = 50;
			if (coors.y + coors.height > window.document.body.clientHeight - bottomMargin) {
				this._data.post_y = window.document.body.clientHeight - coors.height - bottomMargin;
			}
		}
  }
}
</script>
