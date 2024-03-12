const withNextra = require("nextra")({
    theme: "nextra-theme-docs",
    themeConfig: "./theme.config.tsx",
});

module.exports = withNextra({
    i18n: {
        locales: ["ko", "en"],
        defaultLocale: "ko",
    },
    webpack: (config, {}) => {
        config.module.rules.push({
            test: /\.(mp4)$/,
            use: [
                {
                    loader: 'file-loader',
                    options: {
                        name: '[path][name].[ext]',
                        outputPath: 'static/videos/',
                        publicPath: '_next/static/videos/',
                    },
                },
            ],
        });

        return config;
    },
});