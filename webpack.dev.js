const { merge } = require('webpack-merge');
const common = require('./webpack.config.js');
const PrettierPlugin = require("prettier-webpack-plugin");

module.exports = merge(common("development"), {
    mode: 'development',
    plugins: [
        new PrettierPlugin({
            printWidth: 80,
            tabWidth: 2,
            useTabs: true,
            semi: true,
            encoding: 'utf-8',
            extensions: [ ".ts" ]
        })
    ] 
})