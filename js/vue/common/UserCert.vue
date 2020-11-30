<template>
<span v-if='userid'>
<a class='selectedUser' @click.prevent='selectUser'>{{userid}}</a>
</span>
</template>

<script>
export default {
	computed: {
		userid() {
			return this.$store.state.userid;
		}
	},
	methods: {
		selectUser: function() {
			return Millchan.selectUser();
	      }
	}
}
</script>
