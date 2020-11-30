import Vue from "vue";
import Vuetify from 'vuetify';
import VueI18n from "vue-i18n";
import store from "store";
import VueObserveVisibility from 'vue-observe-visibility'
import 'Vuetify/dist/vuetify.min.css';

import Logo from "Common/Logo.vue";
import MCLink from "Common/EngineLink.vue";
import Toolbar from "Common/Toolbar.vue";
import ProcessingOverlay from "Common/ProcessingOverlay.vue";
import Styles from "Common/Styles.vue";

import RouteHome from "Vue/RouteHome.vue";
import RoutePage from "Vue/RoutePage.vue";
import RouteThread from "Vue/RouteThread.vue";
import RouteEdit from "Vue/RouteEdit.vue";
import RouteCatalog from "Vue/RouteCatalog.vue";
import RouteBlacklist from "Vue/RouteBlacklist.vue";
import RouteSearch from "Vue/RouteSearch.vue";

import en from "Vuetify/src/locale/en.ts";
import pl from "Vuetify/src/locale/pl.ts";
import pt from "Vuetify/src/locale/pt.ts";
import ru from "Vuetify/src/locale/ru.ts";
import zh from "Vuetify/src/locale/zh-Hans.ts";
import uk from "Vuetify/src/locale/uk.ts";
import it from "Vuetify/src/locale/it.ts";
import ja from "Vuetify/src/locale/ja.ts";

import mc_en from "Language/en";
import mc_jp from "Language/jp";
import mc_pl from "Language/pl";
import mc_pt from "Language/pt-br";
import mc_ru from "Language/ru";
import mc_zh from "Language/zh";
import mc_uk from "Language/uk";
import mc_it from "Language/it";

import { renderMixin } from "Mixins";

import { mapGetters } from 'vuex'

Vue.use(VueI18n);
const messages = {
	en: {
		$vuetify: en,
		message: mc_en
	},
	pl: {
		$vuetify: pl,
		message: mc_pl
	},
	pt: {
		$vuetify: pt,
		message: mc_pt
	},
	ru: {
		$vuetify: ru,
		message: mc_ru
	},
	zh: {
		$vuetify: zh,
		message: mc_zh
	},
	jp: {
		$vuetify: ja,
		message: mc_jp
	},
	uk: {
		$vuetify: uk,
		message: mc_uk
	},
	it: {
		$vuetify: it,
		message: mc_it
	}
}
const i18n = new VueI18n({
	locale: "en",
	fallbackLocale: "en",
	messages
});

Vue.use(VueObserveVisibility);

Vue.use(Vuetify);
const vuetify = new Vuetify({
  lang: {
		t: (key, ...params) => i18n.t(key, params)
	}
});

  Vue.filter('trim', function(text, length) {
    if (text) {
      if (text.length > length) {
        return text.slice(0, length) + '...';
      }
      return text.slice(0, length);
    }
    return '';
  });

  Vue.filter('unixTodate', function(time) {
    var date;
    date = new Date(time);
    if (date) {
      return `${date.toLocaleString({}, {
        hour12: false
      }).replace(',', '')}`;
    } else {
      console.warn(`Invalid date: '${time}'`);
    }
    return null;
  });
  
  Vue.filter("lower", function(str) {
    if (str) {
      return str.toLowerCase();
    }
  });

  Vue.filter('boardLink', function(board) {
    if (config.board_uri_regex.test(board.uri)) {
      return `?:${board.directory}:${board.uri}:${config.default_to_catalog ? 'catalog' : '0'}`;
    }
  });

 Vue.component("routes", {
	functional: true,
	render: function(h, ctx) {
		if (ctx.parent.$store.state.active_page == null) {
			return;
		}
		return h("route-" + ctx.parent.$store.state.active_page, {
			ref: "threadRef"
		});
	}
 });

 export default {
    el: '#app',
    store,
    i18n,
    vuetify,
    components: {
        "logo": Logo,
        "mclink": MCLink,
        "toolbar": Toolbar,
        "processing-overlay": ProcessingOverlay,
        "styles": Styles,
        "route-home": RouteHome,
        "route-page": RoutePage,
        "route-thread": RouteThread,
        "route-edit": RouteEdit,
        "route-catalog": RouteCatalog,
        "route-blacklist": RouteBlacklist,
        "route-search": RouteSearch
    },
    data: function() {
        return  {
            show_create_reply: null,
            show_quick_reply: false,
            selected_post: null,
            preview_post: null,
            replies: {},
            show_user_menu: false,
            show_faq: false,
            search_board: null,
            reply_body: "",
            selected_post_quote: "",
            user_cert_ids: {},
            slide_images: [],
            show_slider: false,
            previewX: 0,
            previewY: 0,
            scrollOptions: {duration: 1000}
        };
    },
    mounted() {
        //Set the language that will be used for i18n
        i18n.locale = this.$refs.app.$slots.locale[0].text;
        document.getElementById("app").focus();
        window.addEventListener('keyup', (e) => {
            if (this.$store.state.active_page == "thread" && e.target.tagName === "BODY" && e['keyCode'] == 81) { //"q" letter
                this._data.show_quick_reply = true;
            }
        })
    },
    methods: {
        ...renderMixin.methods,
        postLink(post) {
            return `?:${post.directory}:${post.uri}:${post.thread ? post.thread : post.id}`;
        },

        postTarget(post) {
            return `>>>/${post.uri}/${post.id.split('-')[4]}`;
        },

        boardTarget(board) {
            if (config.board_uri_regex.test(board.uri)) {
                let board_title = board.title ? board.title : "????";
                return `/${board.uri}/ - ${board_title}`;
            }
            return "????";
        },

        editBoardLink(board) {
            if (config.board_uri_regex.test(board.uri)) {
                return `?:${board.directory}:${board.uri}:edit`;
            }
        },

        moveToPage(page) {
            this.$store.state.page = page - 1;
            this.$vuetify.goTo('#top-links', {duration: 0});
        },
    },
    watch: {
      darkTheme: function(dark) {
        this.$vuetify.theme.dark = dark;
      },
    },
    computed: {
        ...mapGetters([
            "boardURI",
            "catalogURL",
            "isBlackListed",
            "threads",
            "allThreads",
            "normal_nav",
            "blacklist_nav",
            "darkTheme"
        ]),
    }
}
