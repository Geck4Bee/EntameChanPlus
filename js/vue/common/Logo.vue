<template>
<div align='center' class='pt-5'>
<a @click.prevent="renderHome" :href='main'>
<img id='logo' v-show='display' width='140px' height='auto' @load='display=true' @error='source=fallback' :src='source'>
</a>
</div>
</template>

<script>
import { renderMixin } from "Mixins";
export default {
	mixins: [renderMixin],
	data: function() {
		return {
			main: window.location.pathname,
			source: config.logo,
			fallback: config.fallback_logo,
			display: false
	      };
	}
}
</script>
