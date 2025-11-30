#!/usr/bin/env node

const TOKEN = process.env.LINEAR_API_TOKEN;
if (!TOKEN) {
	console.error("✗ LINEAR_API_TOKEN not set");
	process.exit(1);
}

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
	console.log("Usage: linear-view-list.js [options]");
	console.log("\nList custom views.");
	console.log("\nOptions:");
	console.log("  --team <id>     Filter by team ID");
	console.log("  --shared        Only shared views");
	console.log("  --private       Only private views");
	console.log("\nExamples:");
	console.log("  linear-view-list.js");
	console.log("  linear-view-list.js --team c656e080-...");
	console.log("  linear-view-list.js --shared");
	process.exit(0);
}

let teamFilter = null;
let sharedFilter = null;

for (let i = 0; i < args.length; i++) {
	if (args[i] === "--team" && args[i + 1]) {
		teamFilter = args[i + 1];
		i++;
	} else if (args[i] === "--shared") {
		sharedFilter = true;
	} else if (args[i] === "--private") {
		sharedFilter = false;
	}
}

const query = `
query {
  customViews(first: 100) {
    nodes {
      id
      name
      description
      icon
      color
      shared
      filterData
      owner { id name }
      team { id name }
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

let views = json.data.customViews.nodes;

if (teamFilter) {
	views = views.filter((v) => v.team?.id === teamFilter);
}

if (sharedFilter !== null) {
	views = views.filter((v) => v.shared === sharedFilter);
}

console.log(JSON.stringify(views, null, 2));
