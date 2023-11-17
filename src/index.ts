#!/usr/bin/env node

import path from "node:path";
import fs from "fs-extra";
import ora from "ora";
import { Command } from "commander";
import { z } from "zod";

import { getTemplate } from "@/helpers/getTemplate";
import { getConfig } from "@/helpers/getConfig";
import { getContext } from "@/helpers/getContext";
import { structureRender } from "@/helpers/structureRender";
import { configureHooks, runHooks } from "@/helpers/runHooks";
import { handleError } from "@/utils/handleError";
import { getPackageInfo } from "@/utils/getPackageInfo";
import { CONFIG_FILE_NAME, PKG_ROOT, PKG_TEMPLATE } from "@/consts";

process.on("SIGINT", handleError);
process.on("SIGTERM", handleError);

const optionsSchema = z.object({
  cwd: z.string(),
  default: z.boolean(),
});

async function main() {
  const { packageJson } = getPackageInfo(PKG_ROOT);

  const program = new Command()
    .name("dkcutter")
    .description("A command-line utility that creates projects from templates.")
    .version(
      packageJson.version || "1.0.0",
      "-v, --version",
      "Display the version number.",
    )
    .usage("template [options]")
    .option("-y, --default", "Use the template's default values.", false)
    .option(
      "-c, --cwd <cwd>",
      "The working directory. Defaults to the current directory.",
      process.cwd(),
    )
    .argument("[template]", "The url or path of the template.")
    .allowUnknownOption(true)
    .parse(process.argv);

  const opts = program.opts();
  const options = optionsSchema.parse(opts);
  const cwd = path.resolve(options.cwd);

  // Ensure target directory exists.
  if (!fs.existsSync(cwd)) {
    throw new Error(`The path ${cwd} does not exist. Please try again.`);
  }

  const { args } = program;
  const isLocalProject = args[0]?.startsWith(".") || false;
  const templateFolder = isLocalProject
    ? path.join(cwd, "template")
    : PKG_TEMPLATE;
  if (!args[0]) {
    program.help();
  } else if (z.string().url().safeParse(args[0]).success) {
    await getTemplate({ url: args[0], outputDir: PKG_TEMPLATE });
  } else if (!isLocalProject) {
    throw new Error("Invalid template. Please specify a valid url or path!");
  } else if (!fs.existsSync(templateFolder)) {
    throw new Error("No template found. Please specify a valid url or path!");
  }

  const config = await getConfig(isLocalProject ? cwd : PKG_ROOT);
  if (!config) throw new Error("No configuration found. Please try again.");
  !isLocalProject && fs.removeSync(path.join(PKG_ROOT, CONFIG_FILE_NAME));
  const ctx = await getContext({ config, program, skip: options.default });

  await configureHooks(ctx, isLocalProject ? cwd : PKG_ROOT);
  runHooks({ runHook: "preGenProject.js" });

  const spinner = ora("\nCreating project...").start();
  await structureRender(ctx, templateFolder, cwd);

  runHooks({ runHook: "postGenProject.js" });
  const hooksFolder = path.join(PKG_TEMPLATE, "hooks");
  fs.existsSync(hooksFolder) && fs.removeSync(hooksFolder);
  !isLocalProject && fs.removeSync(path.join(PKG_ROOT, "hooks"));

  spinner.succeed("Project created!");
}

main().catch(handleError);
