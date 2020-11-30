<template>
<form @submit.prevent="editBoard" class="mt-3">
<v-text-field autocomplete='off' :label='$t("message.Title")' v-model='$store.state.boardinfo.title'>
</v-text-field> <v-text-field autocomplete='off' :label='$t("message.Description")' v-model='$store.state.boardinfo.description'>
</v-text-field> <v-btn color='primary' type='submit'>{{$t("message.EditBoard")}}</v-btn>
</form>
</template>

<script>
export default {
    methods: {
      editBoard: function(board) {
        var settings = {};
        settings.uri = this.$store.state.boardinfo.uri;
        settings.config = this.$store.state.boardinfo.config;
        settings.title = this.$store.state.boardinfo.title;
        settings.description = this.$store.state.boardinfo.description;
        return Millchan.editBoard(settings);
      }
    }
}
</script>
