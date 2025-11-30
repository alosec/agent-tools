#!/usr/bin/env node

const TOKEN = process.env.LINEAR_API_TOKEN;
if (!TOKEN) {
	console.error("✗ LINEAR_API_TOKEN not set");
	process.exit(1);
}

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
	console.log("Usage: linear-favorite-list.js [options]");
	console.log("\nList your Linear favorites.");
	console.log("\nOptions:");
	console.log("  --type <type>   Filter by type (project, issue, cycle, document, folder, etc.)");
	console.log("\nExamples:");
	console.log("  linear-favorite-list.js");
	console.log("  linear-favorite-list.js --type project");
	process.exit(0);
}

let typeFilter = null;

for (let i = 0; i < args.length; i++) {
	if (args[i] === "--type" && args[i + 1]) {
		typeFilter = args[i + 1].toLowerCase();
		i++;
	}
}

const query = `
query {
  favorites {
    nodes {
      id
      type
      sortOrder
      folderName
      parent { id folderName }
      project { id name }
      issue { id identifier title }
      cycle { id name number }
      document { id title }
      label { id name }
      customView { id name }
    }
  }
}`;

const res = await fetch("https://api.linear.app/graphql", {
	method: "POST",
	headers: {
		"Content-Type": "application/json",
		Authorization: TOKEN,
	},
	body: JSON.stringify({ query }),
});

const json = await res.json();

if (json.errors) {
	console.error("✗ GraphQL error:", JSON.stringify(json.errors, null, 2));
	process.exit(1);
}

let favorites = json.data.favorites.nodes;

if (typeFilter) {
	favorites = favorites.filter((f) => f.type.toLowerCase().includes(typeFilter));
}

console.log(JSON.stringify(favorites, null, 2));
