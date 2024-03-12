module.exports = {
    module: {
        rules: [
            {
                test: /\.(mov)$/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name: '[name].[ext]',
                            outputPath: 'videos/'
                        }
                    }
                ]
            }
        ]
    }
};