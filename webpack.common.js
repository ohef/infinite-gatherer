const path = require('path');
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
    entry: path.join(__dirname, 'src', 'index.tsx'),
    output: {
        path: path.join(__dirname, 'dist'),
        publicPath: '/',
        filename: "bundle.js",
        chunkFilename: '[name].js'
    },
    module: {
        rules: [{
            rules: [
                {
                    test: /\.(ts|tsx)$/,
                    loader: "ts-loader",
                },
                {
                    test: /.jsx?$/,
                    loader: 'babel-loader',
                    options: {
                        presets: ["@babel/react"],
                        plugins: [
                            'styled-components'
                        ]
                    }
                },
                {test: [/\.glsl$/, /\.html$/], type: 'asset/inline'},
                {test: /.woff$/, loader: "url-loader"},
                {
                    test: /.css$/,
                    use: ['style-loader', 'css-loader']
                },
            ],
            include: [
                path.resolve(__dirname, 'src')
            ],
            exclude: [
                path.resolve(__dirname, 'node_modules')
            ],
        }]
    },
    resolve: {
        extensions: ['.json', '.js', '.jsx', '.ts', '.tsx', '.html']
    },
    plugins: [
        new CopyPlugin({
            patterns: [{
                from: "manifest.json",
                to: "."
            }]
        })]
}