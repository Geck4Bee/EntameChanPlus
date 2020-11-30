<template>
<v-layout>
<v-flex class='text-xs-right'>
<span>
<input ref='check' @change='updateLocalStorage' type='checkbox' :checked='$store.state.blacklist_active'>
<label class='blacklist-toggle'>{{$t("message.EnableBlacklist")}}</label>
<a @click.prevent="renderBlacklist()" :href="blacklist">[{{$t("message.Blacklist")}}]</a>
</span>
</v-flex>
</v-layout>
</template>

<script>
import {renderMixin} from "Mixins";
export default {
    mixins: [renderMixin],
    methods: {
      updateLocalStorage: function() {
        return Millchan.getLocalStorage().then((local_storage) => {
          if (local_storage == null) {
            local_storage = {};
          }
          local_storage[`blacklist:${this.$store.state.directory}:${this.$store.state.uri}`] = this.$refs.check.checked;
          Millchan.setLocalSettings(local_storage);
          return Millchan.urlRoute();
        });
      }
    },
    computed: {
		blacklist() {
			return `${location.pathname}?:${this.$store.state.directory}:${this.$store.state.uri}:blacklist`;
		}
	}
}
</script>
