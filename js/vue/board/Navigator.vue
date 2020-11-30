<template>
<v-bottom-navigation class="flex-wrap elevation-0" background-color="transparent" active-class="elevation-1" :value="current">
<v-btn class="navigator" :key="nav_page" :value="nav_page" v-for='nav_page in pages' @click='$root.moveToPage(nav_page)'>{{nav_page}}</v-btn>
</v-bottom-navigation>
</template>

<script>
import { mapState } from "vuex";
export default {
	computed: {
		...mapState([
			"blacklist_active",
			"page"
		]),
		pages() {
			return this.blacklist_active ? this.$root.blacklist_nav : this.$root.normal_nav;
		},
		current() {
			return Number(this.page) + 1;
		}
	}
}

</script>

<style scoped>
.navigator {
	height: 35px !important;
}
</style>