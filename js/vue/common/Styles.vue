<template>
<v-layout class="pr-12" justify-end>
<v-flex style="z-index: 15;" text-xs-right xs1>
<v-select :items='styles' @change='changeStyle' v-model='$store.state.local_storage.style'>
</v-select>
</v-flex>
</v-layout>
</template>

<script>
import store from "store";

export default {
    data: function() {
      return {
        styles: []
      };
    },
    mounted: function() {
      var css, i, len1, ref;
      ref = config.styles;
      for (i = 0, len1 = ref.length; i < len1; i++) {
        css = ref[i];
        this._data.styles.push(css);
      }
    },
    methods: {
      changeStyle: (css) => {
        var i, len1, ref, ref1, style;
        ref = window.document.styleSheets;
        for (i = 0, len1 = ref.length; i < len1; i++) {
          style = ref[i];
          if (style.href && style.href.split('/').includes(css)) {
            style.disabled = false;
          } else if (style.href && !config.enabled_themes.includes(style.href.split('/')[5])) {
            style.disabled = true;
          }
        }
        Millchan.getLocalSettings().then(function(settings) {
          if (settings == null) {
            settings = {};
          }
          settings["style"] = css;
          return Millchan.setLocalSettings(settings);
        });
        return store.dispatch("setDarkTheme", css);
      }
    }
}
</script>
