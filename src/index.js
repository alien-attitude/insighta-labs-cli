#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import { loginCommand, logoutCommand, whoamiCommand } from "./commands/auth.js";
import { listCommand, getCommand, searchCommand, createCommand, exportCommand } from "./commands/profiles.js";

const program = new Command();

program
  .name("insighta")
  .description(chalk.cyan("Insighta Labs+ CLI — Demographic intelligence from your terminal"))
  .version("3.0.0");

// ── Auth ──────────────────────────────────────────────────────────────────────

program
  .command("login")
  .description("Authenticate via GitHub OAuth")
  .action(loginCommand);

program
  .command("logout")
  .description("Log out and clear stored credentials")
  .action(logoutCommand);

program
  .command("whoami")
  .description("Show current authenticated user")
  .action(whoamiCommand);

// ── Profiles ──────────────────────────────────────────────────────────────────

const profiles = program.command("profiles").description("Manage demographic profiles");

profiles
  .command("list")
  .description("List profiles with optional filters, sorting, and pagination")
  .option("--gender <gender>",       "Filter by gender (male|female)")
  .option("--country <country_id>",  "Filter by ISO country code (e.g. NG)")
  .option("--age-group <group>",     "Filter by age group (child|teenager|adult|senior)")
  .option("--min-age <n>",           "Minimum age")
  .option("--max-age <n>",           "Maximum age")
  .option("--sort-by <field>",       "Sort field (age|created_at|gender_probability)")
  .option("--order <order>",         "Sort order (asc|desc)", "asc")
  .option("--page <n>",              "Page number", "1")
  .option("--limit <n>",             "Results per page (max 50)", "10")
  .action(listCommand);

profiles
  .command("get <id>")
  .description("Get a single profile by UUID")
  .action(getCommand);

profiles
  .command("search <query>")
  .description('Natural language search (e.g. "young males from nigeria")')
  .option("--page <n>",  "Page number", "1")
  .option("--limit <n>", "Results per page", "10")
  .action(searchCommand);

profiles
  .command("create")
  .description("Create a new profile by name (admin only)")
  .requiredOption("--name <name>", "Person's name")
  .action(createCommand);

profiles
  .command("export")
  .description("Export profiles to CSV (admin only)")
  .requiredOption("--format <format>", "Export format (csv)")
  .option("--gender <gender>",       "Filter by gender")
  .option("--country <country_id>",  "Filter by country code")
  .option("--age-group <group>",     "Filter by age group")
  .option("--min-age <n>",           "Minimum age")
  .option("--max-age <n>",           "Maximum age")
  .action(exportCommand);

program.parse(process.argv);
