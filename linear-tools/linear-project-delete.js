#!/usr/bin/env node

const TOKEN = process.env.LINEAR_API_TOKEN;
if (!TOKEN) {
	console.error("✗ LINEAR_API_TOKEN not set");
	process.exit(1);
}

const args = process.argv.slice(2);

if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
	console.log("Usage: linear-project-delete.js <projectId>");
	console.log("\nDelete (trash) a Linear project.");
	console.log("\nNote: This moves the project to trash. Use Linear UI to permanently delete.");
	console.log("\nExamples:");
	console.log("  linear-project-delete.js 7eed5c01-e659-4ea6-bc39-f6026de1eb2b");
	process.exit(args.length === 0 ? 1 : 0);
}

const projectId = args[0];

const mutation = `
mutation($id: String!) {
  projectDelete(id: $id) {
    success
  }
}`;

const res = await fetch("https://api.linear.app/graphql", {
	method: "POST",
	headers: {
		"Content-Type": "application/json",
		Authorization: TOKEN,
	},
	body: JSON.stringify({ query: mutation, variables: { id: projectId } }),
});

const json = await res.json();

if (json.errors) {
	console.error("✗ GraphQL error:", JSON.stringify(json.errors, null, 2));
	process.exit(1);
}

if (!json.data.projectDelete.success) {
	console.error("✗ Failed to delete project");
	process.exit(1);
}

console.log(JSON.stringify({ success: true, id: projectId, message: "Project moved to trash" }, null, 2));
