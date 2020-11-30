<template>
<v-data-table id="popular-boards" v-if='boards && boards.length' :headers="headers" :search='search_board' :footer-props="{nextIcon:'▸', prevIcon:'◂'}" :items-per-page='rows' :items='boards'>
  <template v-slot:item.uri="{ item }">
    <a @click.prevent="renderPage(item)" :href="item|boardLink" :title="userIDFromDirectory(item.directory)">{{boardTarget(item)}}</a>
  </template>
  <template v-slot:item.title="{ item }">
    <span :title="item.description">{{item.title|trim(200)}}</span>
  </template>
  <template v-slot:item.action="{ item }">
    <boards-menu :board="item"/>
  </template>
</v-data-table>
</template>

<script>
import Menu from "Home/BoardsMenu.vue";
import { filterMixin, renderMixin } from "Mixins";

export default {
    mixins: [filterMixin, renderMixin],
    props: ["search_board"],
    components: {
      "boards-menu": Menu
    },
    computed: {
      boards() {
        return this.filter(this.$store.state.popular_boards);
      }
    },
    data: function() {
      return {
        rows: config.popular_boards,
        expanded: [],
        headers: [
          { text: "Uri", value: "uri"},
          { text: this.$t("message.Title"), value: "title"},
          { text: this.$t("message.TotalPosts"), value: "total_posts"},
          { text: "", value: "action", sortable: false}
        ]
      };
    },
    methods: {
      boardTarget: function(board) {
        if (config.board_uri_regex.test(board.uri)) {
          return `/${board.uri}/`;
        }
      },
      userIDFromDirectory: function(dir) {
        return dir.split('/')[1];
      }
    }
}
</script>