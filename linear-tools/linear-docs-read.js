#!/usr/bin/env node

const TOKEN = process.env.LINEAR_API_TOKEN;
if (!TOKEN) {
	console.error("✗ LINEAR_API_TOKEN not set");
	process.exit(1);
}

const docId = process.argv[2];

if (!docId || docId === "--help" || docId === "-h") {
	console.log("Usage: linear-docs-read.js <document-id>");
	console.log("\nRead a Linear document by ID or slugId.");
	console.log("\nExamples:");
	console.log("  linear-docs-read.js abc123");
	console.log("  linear-docs-read.js my-doc-slug");
	process.exit(docId ? 0 : 1);
}

const query = `
query($id: String!) {
  document(id: $id) {
    id
    title
    slugId
    content
    createdAt
    updatedAt
    project { id name }
  }
}`;

const res = await fetch("https://api.linear.app/graphql", {
	method: "POST",
	headers: {
		"Content-Type": "application/json",
		Authorization: TOKEN,
	},
	body: JSON.stringify({ query, variables: { id: docId } }),
});

const json = await res.json();

if (json.errors) {
	console.error("✗ GraphQL error:", JSON.stringify(json.errors, null, 2));
	process.exit(1);
}

if (!json.data.document) {
	console.error("✗ Document not found:", docId);
	process.exit(1);
}

console.log(JSON.stringify(json.data.document, null, 2));
