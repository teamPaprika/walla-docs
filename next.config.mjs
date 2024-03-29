import nextra from "nextra";

const withNextra = nextra({
    theme: "nextra-theme-docs",
    themeConfig: "./theme.config.tsx",
    // staticImage: true,
});

export default withNextra({
    reactStrictMode: true,
    i18n: {
        locales: ["en", "ko"],
        defaultLocale: "ko",
    },
    async redirects() {
        return [
            {
                source: '/',
                destination: '/Introduction',
                permanent: true,
            },
        ];
    },
});