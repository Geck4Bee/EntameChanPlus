<template>
<v-dialog v-model='$root.show_slider'>
	<v-carousel v-if='$root.show_slider' height="80vmin" delimiter-icon='•' next-icon='▸' prev-icon='◂' cycle show-arrows-on-hover progress hide-delimiters>
		<v-carousel-item v-for='image in $root._data.slide_images' :src='validateSource(image.directory,image.original)' :key='fileKey(image)' style="background-color: rgba(40,40,40,0.85);" contain></v-carousel-item>
	</v-carousel>
</v-dialog>
</template>

<script>
import { fileMixin } from "Mixins";

export default {
	mixins: [fileMixin],
    methods: {
      fileKey: function(file) {
        return `${file.thumb}-${file.original}`;
      }
    }
}
</script>