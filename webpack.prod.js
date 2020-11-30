const { merge } = require('webpack-merge');
const common = require('./webpack.config.js');
const TerserPlugin = require("terser-webpack-plugin");

module.exports = merge(common("production"), {
    mode: 'production',
    optimization: {
        minimize: true,
        minimizer: [new TerserPlugin({
            extractComments: false,
        })],
    },
})