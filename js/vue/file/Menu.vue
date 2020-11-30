<template>
<v-menu>
  <template v-slot:activator="{ on }">
	<button v-on="on">▶</button>
  </template>
	<v-list>
		<v-list-item @click='deleteFile(file)'>
			<v-list-item-title>{{$t("message.DeleteFile")}}</v-list-item-title>
		</v-list-item>
		<v-list-item v-if='pinned' @click='unpinFile(file)'>
			<v-list-item-title>{{$t("message.UnpinFile")}}</v-list-item-title>
		</v-list-item>
		<v-list-item v-else @click='pinFile(file)'>
			<v-list-item-title>{{$t("message.PinFile")}}</v-list-item-title>
		</v-list-item>
	</v-list>
</v-menu>
</template>

<script>
import { fileMixin } from "Mixins";

export default {
	mixins: [fileMixin],
    props: ["file", "pinned"],
    methods: {
      deleteFile: function(file) {
        Millchan.cmd("optionalFileDelete", [this.validateSource(file.directory, file.original), config.address]);
        if (file.thumb) {
          Millchan.cmd("optionalFileDelete", [this.validateImageSrc(file.directory, file.thumb), config.address]);
        }
        this.$emit("deleted");
        return this.$emit('updateinfo');
      },
      unpinFile: function(file) {
        Millchan.cmd("optionalFileUnpin", {
          "inner_path": [this.validateSource(file.directory, file.original)]
        });
        return this.$emit('updateinfo');
      },
      pinFile: function(file) {
        Millchan.cmd("optionalFilePin", {
          "inner_path": [this.validateSource(file.directory, file.original)]
        });
        return this.$emit('updateinfo');
      }
    }
}
</script>
