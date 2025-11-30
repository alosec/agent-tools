#!/usr/bin/env node

const TOKEN = process.env.LINEAR_API_TOKEN;
if (!TOKEN) {
	console.error("✗ LINEAR_API_TOKEN not set");
	process.exit(1);
}

const args = process.argv.slice(2);

if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
	console.log("Usage: linear-favorite-create.js [options]");
	console.log("\nAdd an item to favorites. Specify one item type.");
	console.log("\nOptions:");
	console.log("  --project <id>    Favorite a project");
	console.log("  --issue <id>      Favorite an issue");
	console.log("  --cycle <id>      Favorite a cycle");
	console.log("  --document <id>   Favorite a document");
	console.log("  --label <id>      Favorite a label");
	console.log("  --view <id>       Favorite a custom view");
	console.log("  --folder <name>   Create a favorite folder");
	console.log("  --parent <id>     Parent folder ID (for organizing)");
	console.log("\nExamples:");
	console.log("  linear-favorite-create.js --project 7eed5c01-...");
	console.log("  linear-favorite-create.js --issue ABG-5");
	console.log("  linear-favorite-create.js --folder 'Key Projects'");
	process.exit(args.length === 0 ? 1 : 0);
}

let projectId = null;
let issueId = null;
let cycleId = null;
let documentId = null;
let labelId = null;
let customViewId = null;
let folderName = null;
let parentId = null;

for (let i = 0; i < args.length; i++) {
	if (args[i] === "--project" && args[i + 1]) {
		projectId = args[i + 1];
		i++;
	} else if (args[i] === "--issue" && args[i + 1]) {
		issueId = args[i + 1];
		i++;
	} else if (args[i] === "--cycle" && args[i + 1]) {
		cycleId = args[i + 1];
		i++;
	} else if (args[i] === "--document" && args[i + 1]) {
		documentId = args[i + 1];
		i++;
	} else if (args[i] === "--label" && args[i + 1]) {
		labelId = args[i + 1];
		i++;
	} else if (args[i] === "--view" && args[i + 1]) {
		customViewId = args[i + 1];
		i++;
	} else if (args[i] === "--folder" && args[i + 1]) {
		folderName = args[i + 1];
		i++;
	} else if (args[i] === "--parent" && args[i + 1]) {
		parentId = args[i + 1];
		i++;
	}
}

const input = {};
if (projectId) input.projectId = projectId;
if (issueId) input.issueId = issueId;
if (cycleId) input.cycleId = cycleId;
if (documentId) input.documentId = documentId;
if (labelId) input.labelId = labelId;
if (customViewId) input.customViewId = customViewId;
if (folderName) input.folderName = folderName;
if (parentId) input.parentId = parentId;

if (Object.keys(input).length === 0 || (Object.keys(input).length === 1 && parentId)) {
	console.error("✗ Must specify an item to favorite (--project, --issue, --folder, etc.)");
	process.exit(1);
}

const mutation = `
mutation($input: FavoriteCreateInput!) {
  favoriteCreate(input: $input) {
    success
    favorite {
      id
      type
      sortOrder
      parent { id }
    }
  }
}`;

const res = await fetch("https://api.linear.app/graphql", {
	method: "POST",
	headers: {
		"Content-Type": "application/json",
		Authorization: TOKEN,
	},
	body: JSON.stringify({ query: mutation, variables: { input } }),
});

const json = await res.json();

if (json.errors) {
	console.error("✗ GraphQL error:", JSON.stringify(json.errors, null, 2));
	process.exit(1);
}

if (!json.data.favoriteCreate.success) {
	console.error("✗ Failed to create favorite");
	process.exit(1);
}

console.log(JSON.stringify(json.data.favoriteCreate.favorite, null, 2));
