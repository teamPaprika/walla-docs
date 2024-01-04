import React from "react";
import { DocsThemeConfig } from "nextra-theme-docs";

const config: DocsThemeConfig = {
  logo: <span>Walla Handbook</span>,
  footer: {
    component: () => <div></div>,
  },
  feedback: {
    content: () => <div></div>,
  },
  editLink: {
    component: () => <div></div>,
  },
  i18n: [
    { locale: "ko", text: "한국어" },
    { locale: "en", text: "English" },
  ],
};

export default config;
