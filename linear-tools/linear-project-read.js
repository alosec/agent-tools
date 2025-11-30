#!/usr/bin/env node

const TOKEN = process.env.LINEAR_API_TOKEN;
if (!TOKEN) {
	console.error("✗ LINEAR_API_TOKEN not set");
	process.exit(1);
}

const args = process.argv.slice(2);

if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
	console.log("Usage: linear-project-read.js <projectId>");
	console.log("\nGet details for a Linear project.");
	console.log("\nExamples:");
	console.log("  linear-project-read.js 7eed5c01-e659-4ea6-bc39-f6026de1eb2b");
	process.exit(args.length === 0 ? 1 : 0);
}

const projectId = args[0];

const query = `
query($id: String!) {
  project(id: $id) {
    id
    name
    slugId
    description
    content
    icon
    color
    priority
    state
    startDate
    targetDate
    completedAt
    canceledAt
    createdAt
    updatedAt
    lead { id name email }
    members { nodes { id name email } }
    teams { nodes { id name } }
    issues { nodes { id identifier title state { name } } }
  }
}`;

const res = await fetch("https://api.linear.app/graphql", {
	method: "POST",
	headers: {
		"Content-Type": "application/json",
		Authorization: TOKEN,
	},
	body: JSON.stringify({ query, variables: { id: projectId } }),
});

const json = await res.json();

if (json.errors) {
	console.error("✗ GraphQL error:", JSON.stringify(json.errors, null, 2));
	process.exit(1);
}

if (!json.data.project) {
	console.error("✗ Project not found:", projectId);
	process.exit(1);
}

console.log(JSON.stringify(json.data.project, null, 2));
