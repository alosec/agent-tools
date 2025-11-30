#!/usr/bin/env node

const TOKEN = process.env.LINEAR_API_TOKEN;
if (!TOKEN) {
	console.error("✗ LINEAR_API_TOKEN not set");
	process.exit(1);
}

const args = process.argv.slice(2);

if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
	console.log("Usage: linear-docs-update.js <document-id> [options]");
	console.log("\nUpdate a Linear document.");
	console.log("\nOptions:");
	console.log("  --title <text>      New title");
	console.log("  --content <text>    New content (markdown)");
	console.log("  --content-file <f>  Read content from file");
	console.log("\nExamples:");
	console.log('  linear-docs-update.js abc123 --title "New Title"');
	console.log('  linear-docs-update.js abc123 --content "# Updated\\n..."');
	console.log("  linear-docs-update.js abc123 --content-file ./updated.md");
	process.exit(args.length === 0 ? 1 : 0);
}

import { readFileSync } from "fs";

const docId = args[0];
let title = null;
let content = null;

for (let i = 1; i < args.length; i++) {
	if (args[i] === "--title" && args[i + 1]) {
		title = args[i + 1];
		i++;
	} else if (args[i] === "--content" && args[i + 1]) {
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
	}
}

if (!title && !content) {
	console.error("✗ Must provide --title or --content to update");
	process.exit(1);
}

const mutation = `
mutation($id: String!, $input: DocumentUpdateInput!) {
  documentUpdate(id: $id, input: $input) {
    success
    document {
      id
      title
      slugId
      updatedAt
    }
  }
}`;

const input = {};
if (title) input.title = title;
if (content) input.content = content;

const res = await fetch("https://api.linear.app/graphql", {
	method: "POST",
	headers: {
		"Content-Type": "application/json",
		Authorization: TOKEN,
	},
	body: JSON.stringify({ query: mutation, variables: { id: docId, input } }),
});

const json = await res.json();

if (json.errors) {
	console.error("✗ GraphQL error:", JSON.stringify(json.errors, null, 2));
	process.exit(1);
}

if (!json.data.documentUpdate.success) {
	console.error("✗ Failed to update document");
	process.exit(1);
}

console.log(JSON.stringify(json.data.documentUpdate.document, null, 2));
