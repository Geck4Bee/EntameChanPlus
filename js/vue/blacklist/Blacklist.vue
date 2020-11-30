<template>
<div>
<h2><slot name="header" /></h2>
<list v-if="list.size" :list="list" :owner="owner" :undo="undo" :title="title"/>
<v-alert v-else :value="true" type="info"><slot name="empty" /></v-alert>
</div>
</template>

<script>
import List from "Blacklist/List.vue";

export default {
    props: {
        list: {
            type: Set,
            required: true
        },
        owner: {
            type: Boolean,
            default: false
        },
        undo: {
            type: Function,
            required: true
        },
        title: {
            type: String,
            required: true
        }
    },
    components: {
		"list": List,
	}
}
</script>
