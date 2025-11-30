#!/usr/bin/env node

const TOKEN = process.env.LINEAR_API_TOKEN;
if (!TOKEN) {
	console.error("✗ LINEAR_API_TOKEN not set");
	process.exit(1);
}

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
	console.log("Usage: linear-docs-list.js [options]");
	console.log("\nList Linear documents.");
	console.log("\nOptions:");
	console.log("  -n <num>     Number of documents (default: 20)");
	console.log("  --project    Filter by project name");
	console.log("\nExamples:");
	console.log("  linear-docs-list.js");
	console.log("  linear-docs-list.js -n 50");
	console.log("  linear-docs-list.js --project 'My Project'");
	process.exit(0);
}

let limit = 20;
let projectFilter = null;

for (let i = 0; i < args.length; i++) {
	if (args[i] === "-n" && args[i + 1]) {
		limit = parseInt(args[i + 1], 10);
		i++;
	} else if (args[i] === "--project" && args[i + 1]) {
		projectFilter = args[i + 1];
		i++;
	}
}

const query = `
query($first: Int!) {
  documents(first: $first) {
    nodes {
      id
      title
      slugId
      createdAt
      updatedAt
      project { id name }
    }
  }
}`;

const res = await fetch("https://api.linear.app/graphql", {
	method: "POST",
	headers: {
		"Content-Type": "application/json",
		Authorization: TOKEN,
	},
	body: JSON.stringify({ query, variables: { first: limit } }),
});

const json = await res.json();

if (json.errors) {
	console.error("✗ GraphQL error:", JSON.stringify(json.errors, null, 2));
	process.exit(1);
}

let docs = json.data.documents.nodes;

if (projectFilter) {
	docs = docs.filter((d) => d.project?.name?.toLowerCase().includes(projectFilter.toLowerCase()));
}

console.log(JSON.stringify(docs, null, 2));
