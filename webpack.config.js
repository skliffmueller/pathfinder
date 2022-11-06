const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    mode: 'development',
    entry: './src/app/index.ts',
    output: {
        path: `${__dirname}/dist`,
        filename: '[name].bundle.js',
    },
    resolve: {
        // Add `.ts` and `.tsx` as a resolvable extension.
        extensions: [".ts", ".tsx", ".js"]
    },
    module: {
        rules: [
            { test: /\.ts$/, use: 'ts-loader' },
            { test: /\.png$/, use: 'file-loader' },
            {
                test: /\.svg$/,
                use: {
                    loader: 'svg-inline-loader',
                    options: {
                        idPrefix: 'svg-'
                    },
                }
            },
            {
                test: /\.json$/,
                type: "javascript/auto",
                use: {
                    loader: 'file-loader',
                    options: {
                        name: '[path][name].[ext]',
                    },
                },
            },
            {
                test: /\.s[ac]ss$/i,
                use: [
                    // Creates `style` nodes from JS strings
                    "style-loader",
                    // Translates CSS into CommonJS
                    "css-loader",
                    // Compiles Sass to CSS
                    "sass-loader",
                    {
                        loader: "postcss-loader",
                        options: {
                            postcssOptions: {
                                plugins: [
                                    require('postcss-import'),
                                    require('postcss-preset-env')({
                                        stage: 1,
                                    }),
                                    require('postcss-nesting'),
                                    require('tailwindcss')(require('./tailwind.config.js')),
                                    require('autoprefixer'),
                                ]
                            },
                        }
                    }
                ],
            },

        ],
    },
    plugins: [new HtmlWebpackPlugin({
        title: 'Pathfinder',
    })],
};