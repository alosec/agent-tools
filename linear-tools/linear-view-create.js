#!/usr/bin/env node

const TOKEN = process.env.LINEAR_API_TOKEN;
if (!TOKEN) {
	console.error("✗ LINEAR_API_TOKEN not set");
	process.exit(1);
}

const args = process.argv.slice(2);

if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
	console.log("Usage: linear-view-create.js <name> [options]");
	console.log("\nCreate a custom view.");
	console.log("\nOptions:");
	console.log("  --team <id>          Team ID (required for team-scoped views)");
	console.log("  --description <t>    View description");
	console.log("  --shared             Make visible to whole org (default: false)");
	console.log("  --filter <json>      Filter as JSON string");
	console.log("  --filter-file <f>    Read filter from JSON file");
	console.log("\nFilter shortcuts (combine with --filter for more):");
	console.log("  --priority <1-4>     Filter by priority (1=urgent, 2=high, 3=normal, 4=low)");
	console.log("  --state <type>       Filter by state type (backlog, unstarted, started, completed, canceled)");
	console.log("  --exclude-done       Exclude completed and canceled issues");
	console.log("\nExamples:");
	console.log("  linear-view-create.js 'P1 Issues' --team <id> --priority 1 --shared");
	console.log("  linear-view-create.js 'Active' --team <id> --exclude-done");
	console.log("  linear-view-create.js 'Custom' --filter '{\"priority\":{\"in\":[1,2]}}'");
	process.exit(args.length === 0 ? 1 : 0);
}

import { readFileSync } from "fs";

const name = args[0];
let teamId = null;
let description = null;
let shared = false;
let filterData = {};

for (let i = 1; i < args.length; i++) {
	if (args[i] === "--team" && args[i + 1]) {
		teamId = args[i + 1];
		i++;
	} else if (args[i] === "--description" && args[i + 1]) {
		description = args[i + 1];
		i++;
	} else if (args[i] === "--shared") {
		shared = true;
	} else if (args[i] === "--filter" && args[i + 1]) {
		try {
			filterData = { ...filterData, ...JSON.parse(args[i + 1]) };
		} catch (e) {
			console.error("✗ Invalid JSON for --filter");
			process.exit(1);
		}
		i++;
	} else if (args[i] === "--filter-file" && args[i + 1]) {
		try {
			filterData = { ...filterData, ...JSON.parse(readFileSync(args[i + 1], "utf-8")) };
		} catch (e) {
			console.error("✗ Could not read/parse filter file:", args[i + 1]);
			process.exit(1);
		}
		i++;
	} else if (args[i] === "--priority" && args[i + 1]) {
		filterData.priority = { eq: parseInt(args[i + 1], 10) };
		i++;
	} else if (args[i] === "--state" && args[i + 1]) {
		filterData.state = { type: { eq: args[i + 1] } };
		i++;
	} else if (args[i] === "--exclude-done") {
		filterData.state = { type: { nin: ["completed", "canceled"] } };
	}
}

const mutation = `
mutation($input: CustomViewCreateInput!) {
  customViewCreate(input: $input) {
    success
    customView {
      id
      name
      description
      shared
      filterData
      team { id name }
    }
  }
}`;

const input = { name, shared };
if (teamId) input.teamId = teamId;
if (description) input.description = description;
if (Object.keys(filterData).length > 0) input.filterData = filterData;

const res = await fetch("https://api.linear.app/graphql", {
	method: "POST",
	headers: {
		"Content-Type": "application/json",
		Authorization: TOKEN,
	},
	body: JSON.stringify({ query: mutation, variables: { input } }),
});

const json = await res.json();

if (json.errors) {
	console.error("✗ GraphQL error:", JSON.stringify(json.errors, null, 2));
	process.exit(1);
}

if (!json.data.customViewCreate.success) {
	console.error("✗ Failed to create view");
	process.exit(1);
}

console.log(JSON.stringify(json.data.customViewCreate.customView, null, 2));
