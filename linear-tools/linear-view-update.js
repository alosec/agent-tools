#!/usr/bin/env node

const TOKEN = process.env.LINEAR_API_TOKEN;
if (!TOKEN) {
	console.error("✗ LINEAR_API_TOKEN not set");
	process.exit(1);
}

const args = process.argv.slice(2);

if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
	console.log("Usage: linear-view-update.js <viewId> [options]");
	console.log("\nUpdate a custom view.");
	console.log("\nOptions:");
	console.log("  --name <name>        New view name");
	console.log("  --description <t>    View description");
	console.log("  --shared             Make visible to whole org");
	console.log("  --private            Make private");
	console.log("  --filter <json>      Replace filter with JSON");
	console.log("  --filter-file <f>    Read filter from JSON file");
	console.log("\nExamples:");
	console.log("  linear-view-update.js <id> --name 'New Name'");
	console.log("  linear-view-update.js <id> --shared");
	console.log("  linear-view-update.js <id> --filter '{\"priority\":{\"eq\":1}}'");
	process.exit(args.length === 0 ? 1 : 0);
}

import { readFileSync } from "fs";

const viewId = args[0];
let name = null;
let description = null;
let shared = null;
let filterData = null;

for (let i = 1; i < args.length; i++) {
	if (args[i] === "--name" && args[i + 1]) {
		name = args[i + 1];
		i++;
	} else if (args[i] === "--description" && args[i + 1]) {
		description = args[i + 1];
		i++;
	} else if (args[i] === "--shared") {
		shared = true;
	} else if (args[i] === "--private") {
		shared = false;
	} else if (args[i] === "--filter" && args[i + 1]) {
		try {
			filterData = JSON.parse(args[i + 1]);
		} catch (e) {
			console.error("✗ Invalid JSON for --filter");
			process.exit(1);
		}
		i++;
	} else if (args[i] === "--filter-file" && args[i + 1]) {
		try {
			filterData = JSON.parse(readFileSync(args[i + 1], "utf-8"));
		} catch (e) {
			console.error("✗ Could not read/parse filter file:", args[i + 1]);
			process.exit(1);
		}
		i++;
	}
}

const input = {};
if (name) input.name = name;
if (description) input.description = description;
if (shared !== null) input.shared = shared;
if (filterData) input.filterData = filterData;

if (Object.keys(input).length === 0) {
	console.error("✗ No update options provided");
	process.exit(1);
}

const mutation = `
mutation($id: String!, $input: CustomViewUpdateInput!) {
  customViewUpdate(id: $id, input: $input) {
    success
    customView {
      id
      name
      description
      shared
      filterData
      team { id name }
      updatedAt
    }
  }
}`;

const res = await fetch("https://api.linear.app/graphql", {
	method: "POST",
	headers: {
		"Content-Type": "application/json",
		Authorization: TOKEN,
	},
	body: JSON.stringify({ query: mutation, variables: { id: viewId, input } }),
});

const json = await res.json();

if (json.errors) {
	console.error("✗ GraphQL error:", JSON.stringify(json.errors, null, 2));
	process.exit(1);
}

if (!json.data.customViewUpdate.success) {
	console.error("✗ Failed to update view");
	process.exit(1);
}

console.log(JSON.stringify(json.data.customViewUpdate.customView, null, 2));
