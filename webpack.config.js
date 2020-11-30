const path = require("path");
const { VueLoaderPlugin } = require("vue-loader");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

let lastCommit = require('child_process')
  .execSync('git rev-parse --short HEAD')

module.exports = (env) => {
	return {
		entry: "./js/index.js",
		output: {
			path: path.resolve(__dirname, 'dist/'),
			filename: '[name].js',
			publicPath: './dist/'
		},
		resolve: {
			extensions: ['.ts', '.js', '.json'],
			alias: {
				store: path.resolve(__dirname, "js/store"),
				database: path.resolve(__dirname, "js/millchan/database"),
				vue: env === "production" ? "vue/dist/vue.min.js" : "vue/dist/vue.js",
				vuetify: env === "production" ? "vuetify/dist/vuetify.min.js" : "vuetify/dist/vuetify.js",
				Vuetify: path.resolve(__dirname, "node_modules/vuetify"),
				Common: path.resolve(__dirname, "js/vue/common/"),
				Home: path.resolve(__dirname, "js/vue/home/"),
				Board: path.resolve(__dirname, "js/vue/board/"),
				File: path.resolve(__dirname, "js/vue/file/"),
				Post: path.resolve(__dirname, "js/vue/post/"),
				Catalog: path.resolve(__dirname, "js/vue/catalog/"),
				Blacklist: path.resolve(__dirname, "js/vue/blacklist/"),
				Mixins$: path.resolve(__dirname, "js/vue/Mixins"),
				Util$: path.resolve(__dirname, "js/util.ts"),
				Millchan: path.resolve(__dirname, "js/millchan/"),
				Language: path.resolve(__dirname, "js/languages"),
				Parser$: path.resolve(__dirname, "js/parser/format.js"),
				Vue: path.resolve(__dirname, "js/vue"),
				stream: "stream-browserify"
			}
		},
		module: {
			rules: [
				{
					test: /\.vue$/,
					loader: 'vue-loader',
					exclude: /node_modules/
				},
				{
					test: /\.js$/,
					loader: 'babel-loader',
					exclude: /node_modules/,
					options: {
					  presets: ['@babel/preset-env']
					}
				},
				{
					test: /\.worker\.js$/,
					loader: 'worker-loader',
					options: { inline: true },
				},
				{
					test: /\.ts$/,
					loader: 'ts-loader',
					exclude: /node_modules/
				},
				{
					test: /\.css$/,
					use: ['style-loader', 'css-loader'],
				}
			]
		},
		plugins: [
			new CleanWebpackPlugin({
				dry: false,
				verbose: true,
				dangerouslyAllowCleanPatternsOutsideProject: false,
				cleanStaleWebpackAssets: false,
			}),
			new VueLoaderPlugin(),
			new HtmlWebpackPlugin({
					alljs: env === "production" ? "dist/main.zip/main.js" : "dist/main.js",
					lastcommit: lastCommit ? lastCommit.toString() : "",
					template: './index.template.html',
					filename: path.resolve(__dirname, 'index.html'),
					inject: false
			}),
		],
	};
}
