<template>
<div>
<v-alert type='info' :value='true'>
<div>{{$t("message.DisclaimerUse")}}</div>
<div class='hidden-xs-only'>{{$t("message.DisclaimerMute")}}</div>
</v-alert>
<v-alert type="error" :value="!tor_enabled">{{$t("message.DisclaimerAnonimity")}}</v-alert>
</div>
</template>

<script>
import { mapState } from "vuex";
export default {
    computed: {
        ...mapState([
            "tor_enabled"
        ])
    }
}
</script>
