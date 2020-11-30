<template>
<v-layout class='mb-2' column align-center>
<v-flex xs3 text-center> <v-form @submit.prevent='createBoard'>
<v-btn color='primary' @click='show_create_board = !show_create_board'>
<slot v-if="show_create_board" name="hide"/>
<slot v-else name="new_board"/>
</v-btn>
<template v-if="show_create_board">
<v-text-field label='URI' :prefix='delimiter' :suffix='delimiter' v-model='uri' id='board_uri' autocomplete='off' required></v-text-field>
<v-text-field :label='$t("message.Title")' id='board_title' autocomplete='off' required></v-text-field>
<user-cert></user-cert>
<v-spacer></v-spacer>
<v-btn color='primary' type='submit'>
<slot name="create"/>
</v-btn>
</template>
</v-form>
</v-flex>
</v-layout>
</template>

<script>
import UserCert from "Common/UserCert.vue";

export default {
	components: {
		"user-cert": UserCert
	},
	data: function() {
		return {
			show_create_board: false,
			uri: null
		};
	},
	computed: {
		delimiter() {
			if(this._data.uri) {
				return '/';
			}
		}
	},
	methods: {
		createBoard: function() {
			return Millchan.createBoard();
		}
	}
}
</script>
