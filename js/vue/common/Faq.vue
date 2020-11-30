<template>
<div class='overlay-mask' @click='$root._data.show_faq = false'>
	<div class='overlay-content'>
		<div id='menu-content'>
			<h4 class='faq-question'>投稿しようとすると、いつも'Generating anonymous certificate' という通知が表示される</h4>
			<span class='faq-answer'>'millchan'の証明書を /ZeroNet/data/users.json から削除して, ZeroNetを再起動してください.</span>
			<hr class='question-hr'/>
			<h4 class='faq-question'>このレス気に食わねぇ!
				<br/>削除できる?
			</h4>
			<span class='faq-answer'>管理人からはできません. 自分が見ているコンテンツをコントロールできるのは自分だけです.
				<br/> 見たくないコンテンツをフィルタリングするためのツールがあります.
				<br/>使ってください. 
			</span>
			<hr class='question-hr'/>
			<h4 class='faq-question'>ユーザーの
				<i>ミュート解除</i> ミュートってできる？
			</h4>
			<span class='faq-answer'> 
				<a href='http://127.0.0.1:43110/1HeLLo4uzjaLetFx6NH3PMwFP3qbRbTf3D/'>ZeroHello</a> に行ってロゴの横にある「3つの点」をクリックしてください <br/>
				<strong>"ミュートユーザーの管理ができます"</strong>. 
			</span>
			<hr class='question-hr'/>
			<h4 class='faq-question'>どの拡張子が許可されてる?</h4>
			<span class='faq-answer'>
				<ul class='ma-2'>
					<li v-for='(type, index) in allowed_types' :key="index">{{type}}</li>
				</ul>
			</span>
			<v-btn small @click='$root.show_faq=false'>閉じる</v-btn>
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
