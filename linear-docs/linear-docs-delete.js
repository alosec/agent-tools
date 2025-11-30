#!/usr/bin/env node

const TOKEN = process.env.LINEAR_API_TOKEN;
if (!TOKEN) {
	console.error("✗ LINEAR_API_TOKEN not set");
	process.exit(1);
}

const docId = process.argv[2];

if (!docId || docId === "--help" || docId === "-h") {
	console.log("Usage: linear-docs-delete.js <document-id>");
	console.log("\nDelete a Linear document.");
	console.log("\nExamples:");
	console.log("  linear-docs-delete.js abc123");
	process.exit(docId ? 0 : 1);
}

const mutation = `
mutation($id: String!) {
  documentDelete(id: $id) {
    success
  }
}`;

const res = await fetch("https://api.linear.app/graphql", {
	method: "POST",
	headers: {
		"Content-Type": "application/json",
		Authorization: TOKEN,
	},
	body: JSON.stringify({ query: mutation, variables: { id: docId } }),
});

const json = await res.json();

if (json.errors) {
	console.error("✗ GraphQL error:", JSON.stringify(json.errors, null, 2));
	process.exit(1);
}

if (!json.data.documentDelete.success) {
	console.error("✗ Failed to delete document");
	process.exit(1);
}

console.log("✓ Deleted document:", docId);
