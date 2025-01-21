import * as path from "node:path";
import { pluginShiki } from "@rspress/plugin-shiki";
import { pluginFontOpenSans } from "rspress-plugin-font-open-sans";
import { defineConfig } from "rspress/config";

export default defineConfig({
  root: path.join(__dirname, "docs"),
  title: "DKCutter",
  description: "A command-line utility that creates projects from templates.",
  logo: "/dkcutter-icon.png",
  logoText: "DKCutter",
  icon: "/dkcutter-icon.png",
  globalStyles: path.join(__dirname, "theme", "index.css"),
  markdown: {
    checkDeadLinks: true,
    codeHighlighter: "shiki",
  },
  route: {
    cleanUrls: true,
  },
  ssg: {
    strict: true,
  },
  plugins: [pluginFontOpenSans(), pluginShiki()],
  themeConfig: {
    enableScrollToTop: true,
    footer: {
      message: "© 2024 DKCutter",
    },
    socialLinks: [
      {
        icon: "github",
        mode: "link",
        content: "https://github.com/dkshs/dkcutter",
      },
    ],
  },
});
