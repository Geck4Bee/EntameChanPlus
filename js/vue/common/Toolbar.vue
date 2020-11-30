<template>
<v-layout row>
<v-flex xs12>
<user-menu v-if='$root.show_user_menu'>
</user-menu>
<faq v-if='$root.show_faq'></faq>
<v-toolbar class='transparent' absolute dense flat>
<v-btn small @click='$root.show_user_menu = true'>
{{$t("message.Options")}}
</v-btn>
<v-btn small @click='$root.show_faq = true'>FAQ</v-btn>
<v-btn small @click="renderSearch()">{{$t("message.Search")}}</v-btn>
</v-toolbar>
</v-flex>
</v-layout>
</template>

<script>
import { renderMixin } from "Mixins";
import Faq from "Common/Faq.vue";
import UserMenu from "Common/UserMenu.vue";

export default {
	mixins: [renderMixin],
	components: {
		"user-menu": UserMenu,
		"faq": Faq
	}
}

</script>
