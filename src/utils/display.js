import Table  from "cli-table3";
import chalk  from "chalk";

export function printProfilesTable(profiles) {
  if (!profiles.length) {
    console.log(chalk.yellow("  No profiles found.\n"));
    return;
  }

  const table = new Table({
    head: [
      chalk.cyan("Name"),
      chalk.cyan("Gender"),
      chalk.cyan("Age"),
      chalk.cyan("Age Group"),
      chalk.cyan("Country"),
      chalk.cyan("Country Name"),
    ],
    style: { head: [], border: [] },
    colWidths: [18, 10, 6, 12, 10, 20],
  });

  profiles.forEach((p) => {
    table.push([
      p.name,
      p.gender,
      p.age,
      p.age_group,
      p.country_id,
      p.country_name || "-",
    ]);
  });

  console.log(table.toString());
}

export function printProfileDetail(p) {
  const table = new Table({ style: { head: [], border: [] } });

  const fields = [
    ["ID",                  p.id],
    ["Name",                p.name],
    ["Gender",              `${p.gender} (${p.gender_probability})`],
    ["Age",                 `${p.age} (${p.age_group})`],
    ["Country",             `${p.country_id} — ${p.country_name || "?"} (${p.country_probability})`],
    ["Created",             new Date(p.created_at).toLocaleString()],
  ];

  if (p.sample_size) fields.splice(3, 0, ["Sample Size", p.sample_size]);

  fields.forEach(([k, v]) => table.push({ [chalk.cyan(k)]: String(v) }));
  console.log(table.toString());
}

export function printPagination({ page, limit, total, total_pages }) {
  console.log(
    chalk.gray(`  Page ${page}/${total_pages} · ${total} total results · limit ${limit}\n`)
  );
}

export function printSuccess(msg) { console.log(chalk.green(`✓ ${msg}`)); }
export function printError(msg)   { console.error(chalk.red(`✗ ${msg}`)); }
export function printInfo(msg)    { console.log(chalk.blue(`ℹ ${msg}`)); }
