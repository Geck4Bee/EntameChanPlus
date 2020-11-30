<template>
<footer>
<v-btn @click='clicked = !clicked' small text>Millchan engine</v-btn>
<template v-if='clicked'>
<p><a href='http://127.0.0.1:43110/16B9VydMWJm9MnxUxGXDwyPrksxvuyiQPC' rel='noopener'>Git Center</a></p>
<p><a target='_blank' href='https://gitgud.io/millchan/Millchan' rel='noopener'>GitGud (clearnet)</a></p>
<var><slot></slot></var>
</template>
</footer>
</template>

<script>
export default {
	data: function() {
		return {
			clicked: false
		};
	}
}
</script>
