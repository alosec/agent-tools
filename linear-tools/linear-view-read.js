#!/usr/bin/env node

const TOKEN = process.env.LINEAR_API_TOKEN;
if (!TOKEN) {
	console.error("✗ LINEAR_API_TOKEN not set");
	process.exit(1);
}

const args = process.argv.slice(2);

if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
	console.log("Usage: linear-view-read.js <viewId>");
	console.log("\nGet details for a custom view.");
	console.log("\nExamples:");
	console.log("  linear-view-read.js 4273f30f-0ffa-43ad-...");
	process.exit(args.length === 0 ? 1 : 0);
}

const viewId = args[0];

const query = `
query($id: String!) {
  customView(id: $id) {
    id
    name
    description
    icon
    color
    shared
    filterData
    owner { id name email }
    team { id name }
    createdAt
    updatedAt
  }
}`;

const res = await fetch("https://api.linear.app/graphql", {
	method: "POST",
	headers: {
		"Content-Type": "application/json",
		Authorization: TOKEN,
	},
	body: JSON.stringify({ query, variables: { id: viewId } }),
});

const json = await res.json();

if (json.errors) {
	console.error("✗ GraphQL error:", JSON.stringify(json.errors, null, 2));
	process.exit(1);
}

if (!json.data.customView) {
	console.error("✗ View not found:", viewId);
	process.exit(1);
}

console.log(JSON.stringify(json.data.customView, null, 2));
