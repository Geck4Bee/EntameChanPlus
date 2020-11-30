<template>
    <div class='edited' :title='last_edited|unixTodate'>
        {{$t("message.LastEdited")}}: {{transTime}}
    </div>
</template>

<script>
import { timerMixin } from "Mixins";

export default {
    mixins: [timerMixin],
    props: ["last_edited"],
    mounted() {
        if (this._props.last_edited) {
            this.startTimer(this._props.last_edited, 10000);
        }
    },
    watch: {
        last_edited(updated) {
            this.startTimer(updated, 10000);
        }
    }
}
</script>