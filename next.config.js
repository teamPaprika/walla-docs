const withNextra = require("nextra")({
    theme: "nextra-theme-docs",
    themeConfig: "./theme.config.tsx",
});

module.exports = withNextra({
    i18n: {
        locales: ["ko", "en"],
        defaultLocale: "ko",
    },
    webpack: (config, options) => {
        config.module.rules.push({
            test: /\.mp4$/,
            type: 'asset/resource',
            generator: {
                filename: 'static/videos/[name][ext][query]',
            }
        });

        return config;
    },
});