const ClosurePlugin = require('closure-webpack-plugin');
const path = require('path');

module.exports = {
    mode: 'production',
    entry: [
        path.join(__dirname, './src/filer.js')
    ],
    output: {
        path: path.join(__dirname, 'dist'),
        filename: 'filer.min.js'
    },
    optimization: {
        minimizer: [new ClosurePlugin({mode: 'STANDARD'})],
    },
};