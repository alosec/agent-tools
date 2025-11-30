#!/usr/bin/env node

const TOKEN = process.env.LINEAR_API_TOKEN;
if (!TOKEN) {
	console.error("✗ LINEAR_API_TOKEN not set");
	process.exit(1);
}

const args = process.argv.slice(2);

if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
	console.log("Usage: linear-favorite-delete.js <favoriteId>");
	console.log("\nRemove an item from favorites.");
	console.log("\nNote: Use linear-favorite-list.js to find favorite IDs.");
	console.log("\nExamples:");
	console.log("  linear-favorite-delete.js abc123-def456-...");
	process.exit(args.length === 0 ? 1 : 0);
}

const favoriteId = args[0];

const mutation = `
mutation($id: String!) {
  favoriteDelete(id: $id) {
    success
  }
}`;

const res = await fetch("https://api.linear.app/graphql", {
	method: "POST",
	headers: {
		"Content-Type": "application/json",
		Authorization: TOKEN,
	},
	body: JSON.stringify({ query: mutation, variables: { id: favoriteId } }),
});

const json = await res.json();

if (json.errors) {
	console.error("✗ GraphQL error:", JSON.stringify(json.errors, null, 2));
	process.exit(1);
}

if (!json.data.favoriteDelete.success) {
	console.error("✗ Failed to delete favorite");
	process.exit(1);
}

console.log(JSON.stringify({ success: true, id: favoriteId, message: "Removed from favorites" }, null, 2));
