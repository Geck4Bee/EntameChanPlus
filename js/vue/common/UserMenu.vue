<template>
<div class='overlay-mask'>
	<div class='overlay-content'>
		<div id='menu-content'>
			<form @submit.prevent='save'>
				<fieldset>
					<legend>{{$t("message.Options")}}</legend>
					<div style='margin:10px;font-size:12px;color:black;' v-for='value,key in local_storage.config'>
						<span>{{prettify(key)}}</span>: 
						<input class='numberInput' v-if='Number.isInteger(local_storage.config[key])' type='number' :value='value' @change='local_storage.config[key] = parseInt($event.target.value)' />
						<input v-else-if='typeof(value) === "boolean"' type='checkbox' :value='value' :checked='local_storage.config[key]' @change='local_storage.config[key] = $event.target.checked' />
						<input v-else type='range' min='0' max='0.95' step='0.05' :value='value' @change='local_storage.config[key] = parseFloat($event.target.value)' />
					</div>
					<span style='font-size:11px;color:black;'>
						<a @click.prevent='selectUser'>Select certificate</a>
					</span>
				</fieldset>
				<fieldset v-if='local_blacklist.boards && local_blacklist.boards.length'>
					<legend>Blacklist</legend>
					<div style='font-size:11px;color:black' v-for='board in local_blacklist.boards'>
						<button class='action blacklist' @click.prevent='removeBlacklisted(board)'>{{board}}</button>
					</div>
				</fieldset>
				<v-btn small @click='$root.show_user_menu=false'>{{$t("message.Close")}}</v-btn>
				<v-btn small type='submit'>OK</v-btn>
			</form>
		</div>
	</div>
</div>
</template>

<script>
import { encode } from "Util";
import { mapState } from "vuex";

export default {
	 methods: {
      selectUser: function() {
        return Millchan.selectUser();
      },
      prettify: function(value) {
        return value.replace(/_/g, ' ');
      },
      removeBlacklisted: function(board) {
        return Millchan.cmd("wrapperConfirm", [`Remove <b>/${(board.split(':')[1])}/</b> from blacklist?`], (confirmed) => {
          var index;
          if (confirmed) {
            index = this.local_blacklist.boards.indexOf(board);
            if (board !== -1) {
              this.local_blacklist.boards.splice(index, 1);
              return Millchan.cmd("fileWrite", [Millchan.blacklist_path, encode(this.local_blacklist)], (res) => {
                if (res !== "ok") {
                  return this.error(res.error);
                }
              });
            }
          }
        });
      },
      save: function() {
        Millchan.setLocalSettings(this.local_storage, () => {
          return Millchan.cmd("wrapperNotification", ["done", "Settings updated", config.notification_time]);
        });
        this.$root.show_user_menu = false;
        return Millchan.urlRoute();
      }
    },
    computed: mapState([
		"local_storage",
		"local_blacklist"
	])
}
</script>
