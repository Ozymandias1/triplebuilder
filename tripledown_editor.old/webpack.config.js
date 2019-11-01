const path = require('path');

module.exports = {
    mode: 'development',
    entry: path.join(__dirname, './editor_src/core.ts'),
    output: {
        filename: './js/Engine.js',
        path: __dirname,
        library: ['Engine']
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                exclude: /node_modules/,
            }
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    }
};