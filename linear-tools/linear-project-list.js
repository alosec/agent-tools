#!/usr/bin/env node

const TOKEN = process.env.LINEAR_API_TOKEN;
if (!TOKEN) {
	console.error("✗ LINEAR_API_TOKEN not set");
	process.exit(1);
}

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
	console.log("Usage: linear-project-list.js [options]");
	console.log("\nList Linear projects.");
	console.log("\nOptions:");
	console.log("  -n <num>      Number of projects (default: 50)");
	console.log("  --team <id>   Filter by team ID");
	console.log("  --name <str>  Filter by name (substring match)");
	console.log("\nExamples:");
	console.log("  linear-project-list.js");
	console.log("  linear-project-list.js -n 10");
	console.log("  linear-project-list.js --name 'blog'");
	process.exit(0);
}

let limit = 50;
let teamFilter = null;
let nameFilter = null;

for (let i = 0; i < args.length; i++) {
	if (args[i] === "-n" && args[i + 1]) {
		limit = parseInt(args[i + 1], 10);
		i++;
	} else if (args[i] === "--team" && args[i + 1]) {
		teamFilter = args[i + 1];
		i++;
	} else if (args[i] === "--name" && args[i + 1]) {
		nameFilter = args[i + 1].toLowerCase();
		i++;
	}
}

const query = `
query($first: Int!) {
  projects(first: $first) {
    nodes {
      id
      name
      slugId
      description
      icon
      color
      priority
      state
      startDate
      targetDate
      createdAt
      updatedAt
      teams { nodes { id name } }
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

let projects = json.data.projects.nodes;

if (teamFilter) {
	projects = projects.filter((p) =>
		p.teams.nodes.some((t) => t.id === teamFilter)
	);
}

if (nameFilter) {
	projects = projects.filter((p) =>
		p.name.toLowerCase().includes(nameFilter)
	);
}

console.log(JSON.stringify(projects, null, 2));
