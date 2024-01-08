const withNextra = require("nextra")({
  theme: "nextra-theme-docs",
  themeConfig: "./theme.config.tsx",
  // async rewrites() {
  //   return [
  //     {
  //       source: "/support",
  //       destination: "https://walla.my/survey/dBYpZ05oMg5Bl1XxMGkj",
  //     },
  //   ];
  // },
});

module.exports = withNextra(
//   {
//   // i18n: {
//   //   locales: ["ko", "en"],
//   //   defaultLocale: "ko",
//   // },
// }
);
