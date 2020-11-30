<template>
<div class='overlay-mask' @click='$root._data.show_faq = false'>
	<div class='overlay-content'>
		<div id='menu-content'>
			<h4 class='faq-question'>I'm always getting a notification saying 'Generating anonymous certificate' when I try to post</h4>
			<span class='faq-answer'>Delete the 'millchan' certificate in /ZeroNet/data/users.json, save and restart ZeroNet.</span>
			<hr class='question-hr'/>
			<h4 class='faq-question'>Someone posted something that I do not like!
				<br/>Can you delete it?
			</h4>
			<span class='faq-answer'>I can't. Only you can control the content that you're seeing.
				<br/> There are tools for filtering content that you do not want to see/seed.
				<br/>Use them. 
			</span>
			<hr class='question-hr'/>
			<h4 class='faq-question'>How to 
				<i>unmute</i> muted users?
			</h4>
			<span class='faq-answer'>Go to 
				<a href='http://127.0.0.1:43110/1HeLLo4uzjaLetFx6NH3PMwFP3qbRbTf3D/'>ZeroHello</a> and in the "three dots" next to the logo click <br/>
				<strong>"Manage muted users"</strong>. 
			</span>
			<hr class='question-hr'/>
			<h4 class='faq-question'>Which filetypes are allowed?</h4>
			<span class='faq-answer'>
				<ul class='ma-2'>
					<li v-for='type in allowed_types'>{{type}}</li>
				</ul>
			</span>
			<v-btn small @click='$root.show_faq=false'>Close</v-btn>
		</div>
	</div>
</div>
</template>

<script>
export default {
	data() {
		return {
			allowed_types: config.allowed_mimetype
		};
	}
}
</script>
