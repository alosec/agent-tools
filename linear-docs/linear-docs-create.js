#!/usr/bin/env node

const TOKEN = process.env.LINEAR_API_TOKEN;
if (!TOKEN) {
	console.error("✗ LINEAR_API_TOKEN not set");
	process.exit(1);
}

const args = process.argv.slice(2);

if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
	console.log("Usage: linear-docs-create.js <title> [options]");
	console.log("\nCreate a Linear document. Must specify one parent: --team, --project, or --issue.");
	console.log("\nOptions:");
	console.log("  --content <text>    Document content (markdown)");
	console.log("  --content-file <f>  Read content from file");
	console.log("  --team <id>         Team ID (required if no project/issue)");
	console.log("  --project <id>      Project ID");
	console.log("  --issue <id>        Issue ID");
	console.log("\nExamples:");
	console.log('  linear-docs-create.js "Meeting Notes" --team c656e080-...');
	console.log('  linear-docs-create.js "API Spec" --content "# Overview" --team <id>');
	console.log('  linear-docs-create.js "Design Doc" --content-file ./doc.md --project <id>');
	process.exit(args.length === 0 ? 1 : 0);
}

import { readFileSync } from "fs";

const title = args[0];
let content = null;
let projectId = null;
let teamId = null;
let issueId = null;

for (let i = 1; i < args.length; i++) {
	if (args[i] === "--content" && args[i + 1]) {
		content = args[i + 1];
		i++;
	} else if (args[i] === "--content-file" && args[i + 1]) {
		try {
			content = readFileSync(args[i + 1], "utf-8");
		} catch (e) {
			console.error("✗ Could not read file:", args[i + 1]);
			process.exit(1);
		}
		i++;
	} else if (args[i] === "--project" && args[i + 1]) {
		projectId = args[i + 1];
		i++;
	} else if (args[i] === "--team" && args[i + 1]) {
		teamId = args[i + 1];
		i++;
	} else if (args[i] === "--issue" && args[i + 1]) {
		issueId = args[i + 1];
		i++;
	}
}

if (!projectId && !teamId && !issueId) {
	console.error("✗ Must specify one of: --team, --project, or --issue");
	process.exit(1);
}

const mutation = `
mutation($input: DocumentCreateInput!) {
  documentCreate(input: $input) {
    success
    document {
      id
      title
      slugId
      createdAt
    }
  }
}`;

const input = { title };
if (content) input.content = content;
if (projectId) input.projectId = projectId;
if (teamId) input.teamId = teamId;
if (issueId) input.issueId = issueId;

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

if (!json.data.documentCreate.success) {
	console.error("✗ Failed to create document");
	process.exit(1);
}

console.log(JSON.stringify(json.data.documentCreate.document, null, 2));
