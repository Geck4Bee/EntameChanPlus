<template>
<v-container>
    <v-card class="pa-4">
    <v-row>
        <v-col cols="6">{{title}}</v-col>
        <v-col cols="3">Board</v-col>
        <v-col cols="3">Date</v-col>
    </v-row>
    <v-divider />
    <v-virtual-scroll class="scroll" :items="blacklist" :item-height="60" width="100vh" :height="height">
        <template v-slot="{ item: blacklisted }">
            <v-row>
                     <v-col cols="6">
                        <a v-if='owner' :title='$t("message.RemoveFromBlacklist")' @click.prevent='undo(blacklisted.uri, blacklisted.info)'>
                        {{blacklisted.info}}
                        </a>
                        <span v-else>{{blacklisted.info}}</span>
                     </v-col>
                    <v-col cols="3">
                        <a @click.prevent="renderPage()" :href='blacklisted|boardLink'>/{{blacklisted.uri}}/</a>
                    </v-col>
                    <v-col cols="3">
                        {{blacklisted.time|unixTodate}}
                    </v-col>
            </v-row>
        </template>
    </v-virtual-scroll>
    </v-card>
</v-container>
</template>

<script>
import { renderMixin } from "Mixins";

export default {
    props: {
        list: {
            type: Set,
            required: true,
        },
        owner: {
            type: Boolean,
            default: false,
        },
        undo: {
            type: Function,
            required: true,
        },
        title: {
            type: String,
        }
    },
    mixins: [renderMixin],
    computed: {
        blacklist() {
            return Array.from(this.list);
        },
        height() {
            return Math.min(this.blacklist.length * 60, 600);
        }
    }
}
</script>

<style scoped>
.scroll {
    overflow-x: hidden;
}
</style>