#!/usr/bin/env node

const TOKEN = process.env.LINEAR_API_TOKEN;
if (!TOKEN) {
	console.error("✗ LINEAR_API_TOKEN not set");
	process.exit(1);
}

const args = process.argv.slice(2);

if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
	console.log("Usage: linear-view-delete.js <viewId>");
	console.log("\nDelete a custom view.");
	console.log("\nExamples:");
	console.log("  linear-view-delete.js 4273f30f-0ffa-43ad-...");
	process.exit(args.length === 0 ? 1 : 0);
}

const viewId = args[0];

const mutation = `
mutation($id: String!) {
  customViewDelete(id: $id) {
    success
  }
}`;

const res = await fetch("https://api.linear.app/graphql", {
	method: "POST",
	headers: {
		"Content-Type": "application/json",
		Authorization: TOKEN,
	},
	body: JSON.stringify({ query: mutation, variables: { id: viewId } }),
});

const json = await res.json();

if (json.errors) {
	console.error("✗ GraphQL error:", JSON.stringify(json.errors, null, 2));
	process.exit(1);
}

if (!json.data.customViewDelete.success) {
	console.error("✗ Failed to delete view");
	process.exit(1);
}

console.log(JSON.stringify({ success: true, id: viewId, message: "View deleted" }, null, 2));
