const path = require('path');

module.exports = [{
    mode: 'development',
    devtool: 'source-map',
    entry: {
        'dist/triplebuilder': ['./src/entry.ts'],
        '../triplebuilder_app/js/triplebuilder': ['./src/entry.ts']
    },
    output: {
        filename: '[name].js',
        path: __dirname,
        library: ['TripleBuilder']
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
},{
    mode: 'production',
    entry: {
        'dist/triplebuilder.min': ['./src/entry.ts'],
        '../triplebuilder_app/js/triplebuilder.min': ['./src/entry.ts']
    },
    output: {
        filename: '[name].js',
        path: __dirname,
        library: ['TripleBuilder']
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
}];