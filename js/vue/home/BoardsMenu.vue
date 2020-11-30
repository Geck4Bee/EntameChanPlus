<template>
    <v-menu offset-y>
        <template v-slot:activator="{ on }">
            <v-btn color="blue" :class='{pinned: is_pinned}' icon :title='$t("message.Options")' v-on='on'><img class="static" :src="options"></v-btn>
        </template>
        <v-list>
            <v-list-item v-if='!is_pinned' key='pin' title='Help to distribute files posted in this board' @click='pinBoard(board)'>
                <v-list-item-title>{{$t("message.PinBoard")}}</v-list-item-title>
            </v-list-item>
            <v-list-item v-else key='unpin' title='Unpin downloaded files' @click='unpinBoard(board)'>
                <v-list-item-title>{{$t("message.UnpinBoard")}}</v-list-item-title>
            </v-list-item>
            <v-list-item key='blacklist_board' @click='blacklistBoard(board.directory, board.uri)'>
                <v-list-item-title>{{$t("message.BlacklistBoard")}}</v-list-item-title>
            </v-list-item>
            <v-list-item key='mute_owner' @click='muteUser(board)'>
                <v-list-item-title>{{$t("message.MuteOwner")}}</v-list-item-title>
            </v-list-item>
            <v-list-item key='downloadsmall' @click='downloadBoardFiles(board)'>
                <v-list-item-title>{{$t("message.SeedSmallFiles")}}</v-list-item-title>
            </v-list-item>
            <v-list-item key='downloadbig' @click='downloadBoardFiles(board, true)'>
                <v-list-item-title>{{$t("message.SeedBigFiles")}}</v-list-item-title>
            </v-list-item>
        </v-list>
    </v-menu>
</template>

<script>
import { mapState } from "vuex";

export default {
    props: ["board"],
    computed: {
        ...mapState([
            "local_storage"
        ]),
        is_pinned() {
            return this.isPinnedBoard(this.board)
        }
    },
    data() {
        return {
            options: config.default_options_image,
        }
    },
    methods: {
      isPinnedBoard: function(board) {
        return this.local_storage["pinned"].includes(`${board.directory}:${board.uri}`);
      },
      pinBoard: function(board) {
        return Millchan.cmd("wrapperConfirm", [`Are you sure you want to pin <b>/${board.uri}/</b>?`], (confirmed) => {
          if (confirmed) {
            this.local_storage["pinned"].push(`${board.directory}:${board.uri}`);
            Millchan.pinBoard(board.directory, board.uri);
            Millchan.setLocalSettings(this.local_storage);
          }
        });
      },
      unpinBoard: function(board) {
        this.local_storage["pinned"] = this.local_storage["pinned"].filter(pinned => pinned != `${board.directory}:${board.uri}`);
        Millchan.unpinBoard(board.directory, board.uri);
        Millchan.setLocalSettings(this.local_storage);
      },
      muteUser: function(board) {
        var auth_address;
        auth_address = board.directory.split('/')[1];
        Millchan.killUser(auth_address, board.directory);
      },
	  blacklistBoard: function(dir, uri) {
        Millchan.blacklistBoard(dir, uri);
	  },
	  downloadBoardFiles: function(board, big=false) {
        Millchan.downloadBoardFiles(board.directory, board.uri, big);
	  }
   }
}
</script>