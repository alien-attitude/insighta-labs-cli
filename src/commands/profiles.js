import fs    from "fs";
import path  from "path";
import chalk from "chalk";
import ora   from "ora";
import api   from "../utils/api.js";
import {
  printProfilesTable,
  printProfileDetail,
  printPagination,
  printSuccess,
  printError,
} from "../utils/display.js";

/**
 * insighta profiles list [options]
 */
export async function listCommand(opts) {
  const spinner = ora("Fetching profiles...").start();

  const params = {};
  if (opts.gender)     params.gender     = opts.gender;
  if (opts.country)    params.country_id = opts.country;
  if (opts.ageGroup)   params.age_group  = opts.ageGroup;
  if (opts.minAge)     params.min_age    = opts.minAge;
  if (opts.maxAge)     params.max_age    = opts.maxAge;
  if (opts.sortBy)     params.sort_by    = opts.sortBy;
  if (opts.order)      params.order      = opts.order;
  if (opts.page)       params.page       = opts.page;
  if (opts.limit)      params.limit      = opts.limit;

  try {
    const { data } = await api.get("/api/profiles", { params });
    spinner.stop();
    console.log();
    printProfilesTable(data.data);
    printPagination(data);
  } catch (err) {
    spinner.fail("Failed to fetch profiles");
    printError(err.response?.data?.message || err.message);
    process.exit(1);
  }
}

/**
 * insighta profiles get <id>
 */
export async function getCommand(id) {
  const spinner = ora(`Fetching profile ${id}...`).start();
  try {
    const { data } = await api.get(`/api/profiles/${id}`);
    spinner.stop();
    console.log();
    printProfileDetail(data.data);
  } catch (err) {
    spinner.fail("Failed to fetch profile");
    printError(err.response?.data?.message || err.message);
    process.exit(1);
  }
}

/**
 * insighta profiles search <query>
 */
export async function searchCommand(query, opts) {
  const spinner = ora(`Searching: "${query}"...`).start();
  const params  = { q: query };
  if (opts.page)  params.page  = opts.page;
  if (opts.limit) params.limit = opts.limit;

  try {
    const { data } = await api.get("/api/profiles/search", { params });
    spinner.stop();
    console.log();
    printProfilesTable(data.data);
    printPagination(data);
  } catch (err) {
    spinner.fail("Search failed");
    printError(err.response?.data?.message || err.message);
    process.exit(1);
  }
}

/**
 * insighta profiles create --name <name>
 */
export async function createCommand(opts) {
  if (!opts.name) {
    printError("--name is required");
    process.exit(1);
  }

  const spinner = ora(`Creating profile for "${opts.name}"...`).start();
  try {
    const { data } = await api.post("/api/profiles", { name: opts.name });
    spinner.stop();
    if (data.message) {
      console.log(chalk.yellow(`\n⚠  ${data.message}`));
    } else {
      printSuccess("Profile created successfully");
    }
    console.log();
    printProfileDetail(data.data);
  } catch (err) {
    spinner.fail("Failed to create profile");
    printError(err.response?.data?.message || err.message);
    process.exit(1);
  }
}

/**
 * insighta profiles export --format csv [filters]
 */
export async function exportCommand(opts) {
  if (opts.format !== "csv") {
    printError(`Unsupported format: ${opts.format}. Only 'csv' is supported.`);
    process.exit(1);
  }

  const spinner = ora("Exporting profiles...").start();

  const params = { format: "csv" };
  if (opts.gender)   params.gender     = opts.gender;
  if (opts.country)  params.country_id = opts.country;
  if (opts.ageGroup) params.age_group  = opts.ageGroup;
  if (opts.minAge)   params.min_age    = opts.minAge;
  if (opts.maxAge)   params.max_age    = opts.maxAge;

  try {
    const { data, headers } = await api.get("/api/profiles/export", {
      params,
      responseType: "text",
    });

    // Extract filename from Content-Disposition header or generate one
    const disposition = headers["content-disposition"] || "";
    const match       = disposition.match(/filename="(.+?)"/);
    const filename    = match ? match[1] : `profiles_${Date.now()}.csv`;
    const outputPath  = path.join(process.cwd(), filename);

    fs.writeFileSync(outputPath, data, "utf-8");
    spinner.succeed(`Exported to ${chalk.bold(outputPath)}`);
  } catch (err) {
    spinner.fail("Export failed");
    printError(err.response?.data?.message || err.message);
    process.exit(1);
  }
}
