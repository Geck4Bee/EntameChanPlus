<template>
    <v-menu>
        <template v-slot:activator="{ on }">
	    <button v-on="on">▶</button>
        </template>
        <v-list>
            <v-list-item v-if='!thread.thread && !this.watched_threads.includes(thread.id)' @click='followThread(thread)'>
                <v-list-item-title>{{$t("message.FollowThread")}}</v-list-item-title>
            </v-list-item>
            <v-list-item v-else-if='!thread.thread && this.watched_threads.includes(thread.id)' @click='unfollowThread(thread)'>
                <v-list-item-title>{{$t("message.UnfollowThread")}}</v-list-item-title>
            </v-list-item>
            <v-list-item v-if='is_user_board && !thread.thread && !thread.sticky' @click='stickThread(thread)'>
            <v-list-item-title>{{$t("message.StickThread")}}</v-list-item-title>
            </v-list-item>
            <v-list-item v-if='is_user_board && !thread.thread && thread.sticky' @click='unstickThread(thread)'>
                <v-list-item-title>{{$t("message.UnstickThread")}}</v-list-item-title>
            </v-list-item>
            <v-list-item v-if='isUserPost(thread.json_id)' @click='deletePost(thread)'>
                <v-list-item-title>{{$t("message.DeletePost")}}</v-list-item-title>
            </v-list-item>
            <v-list-item v-if='!isUserPost(thread.json_id)' @click='muteUser(thread)'>
                <v-list-item-title>{{$t("message.MuteUser")}}</v-list-item-title>
            </v-list-item>
        </v-list>
    </v-menu>
</template>

<script>
import { postMixin, MenuMixin } from "Mixins";
import { mapState } from "vuex";

export default {
    mixins: [postMixin, MenuMixin],
    props: ["thread"],
    computed: {
        ...mapState([
            "watched_threads",
            "is_user_board"
        ])
    }
}
</script>