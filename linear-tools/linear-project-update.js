#!/usr/bin/env node

const TOKEN = process.env.LINEAR_API_TOKEN;
if (!TOKEN) {
	console.error("✗ LINEAR_API_TOKEN not set");
	process.exit(1);
}

const args = process.argv.slice(2);

if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
	console.log("Usage: linear-project-update.js <projectId> [options]");
	console.log("\nUpdate a Linear project.");
	console.log("\nOptions:");
	console.log("  --name <name>       New project name");
	console.log("  --description <t>   Project description");
	console.log("  --content <md>      Project content (markdown)");
	console.log("  --icon <emoji>      Project icon");
	console.log("  --color <hex>       Project color (e.g., #ff0000)");
	console.log("  --priority <0-4>    Priority (0=none, 1=urgent, 2=high, 3=normal, 4=low)");
	console.log("  --start <date>      Start date (YYYY-MM-DD)");
	console.log("  --target <date>     Target date (YYYY-MM-DD)");
	console.log("\nExamples:");
	console.log("  linear-project-update.js <id> --name 'New Name'");
	console.log("  linear-project-update.js <id> --priority 1 --target 2025-03-31");
	process.exit(args.length === 0 ? 1 : 0);
}

const projectId = args[0];
let name = null;
let description = null;
let content = null;
let icon = null;
let color = null;
let priority = null;
let startDate = null;
let targetDate = null;

for (let i = 1; i < args.length; i++) {
	if (args[i] === "--name" && args[i + 1]) {
		name = args[i + 1];
		i++;
	} else if (args[i] === "--description" && args[i + 1]) {
		description = args[i + 1];
		i++;
	} else if (args[i] === "--content" && args[i + 1]) {
		content = args[i + 1];
		i++;
	} else if (args[i] === "--icon" && args[i + 1]) {
		icon = args[i + 1];
		i++;
	} else if (args[i] === "--color" && args[i + 1]) {
		color = args[i + 1];
		i++;
	} else if (args[i] === "--priority" && args[i + 1]) {
		priority = parseInt(args[i + 1], 10);
		i++;
	} else if (args[i] === "--start" && args[i + 1]) {
		startDate = args[i + 1];
		i++;
	} else if (args[i] === "--target" && args[i + 1]) {
		targetDate = args[i + 1];
		i++;
	}
}

const mutation = `
mutation($id: String!, $input: ProjectUpdateInput!) {
  projectUpdate(id: $id, input: $input) {
    success
    project {
      id
      name
      slugId
      description
      icon
      color
      priority
      startDate
      targetDate
      updatedAt
      teams { nodes { id name } }
    }
  }
}`;

const input = {};
if (name) input.name = name;
if (description) input.description = description;
if (content) input.content = content;
if (icon) input.icon = icon;
if (color) input.color = color;
if (priority !== null) input.priority = priority;
if (startDate) input.startDate = startDate;
if (targetDate) input.targetDate = targetDate;

if (Object.keys(input).length === 0) {
	console.error("✗ No update options provided");
	process.exit(1);
}

const res = await fetch("https://api.linear.app/graphql", {
	method: "POST",
	headers: {
		"Content-Type": "application/json",
		Authorization: TOKEN,
	},
	body: JSON.stringify({ query: mutation, variables: { id: projectId, input } }),
});

const json = await res.json();

if (json.errors) {
	console.error("✗ GraphQL error:", JSON.stringify(json.errors, null, 2));
	process.exit(1);
}

if (!json.data.projectUpdate.success) {
	console.error("✗ Failed to update project");
	process.exit(1);
}

console.log(JSON.stringify(json.data.projectUpdate.project, null, 2));
