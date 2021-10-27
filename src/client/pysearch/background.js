var indexer = new Indexer(indexData);
var renderer = new Renderer();

// Sanitizes the given string for use as XML body text.
var sanitize = function(text) {
	return text
		.replace(/[^ -~]+/g, "")  // Remove all non-ASCII or non-printable characters
		.replace(/\s+/g, " ")     // Clean up whitespace
		.trim()
		.replace(/&/g, "&amp;")   // Replace XML special characters with character entities
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
};

// Navigates to the given URL.
var navigate = function(url) {
	chrome.tabs.getSelected(null, function(tab) {
		chrome.tabs.update(tab.id, {url: url});
	});
};

// Event handler for when user input is received.
chrome.omnibox.onInputChanged.addListener(function(input, suggest) {
	// Get results from the indexer.
	var results = indexer.search(input);

	// Format the results for display.
	var suggestions = [];
	for (var i = 0; i < results.length; i++) {
		var result = results[i];
		suggestions.push({"content": result, "description": renderer.render(input, result, indexData[result].description)});
	}

	// Display the formatted suggestions.
	suggest(suggestions);

	// Check if an exact match exists for the current input.
	if (indexData[input]) {
		// If an exact match exists, make it the default suggestion.
		chrome.omnibox.setDefaultSuggestion({
			"description": renderer.render(input, input, indexData[input].description)
		});
	} else {
		// Otherwise, make the suggestion search within documentation.
		chrome.omnibox.setDefaultSuggestion({
			"description": "Search for <match>" + sanitize(input) + "</match> in " + LANG_NAME + " documentation"
		});
	}
});

// Event handler for when the enter key is pressed within the omnibox.
chrome.omnibox.onInputEntered.addListener(function(input) {
	// Check if an exact match exists for the current input.
	if (typeof indexData[input] === "object") {
		// If an exact match exists, navigate to the entry URL.
		navigate(ROOT_URL + indexData[input].url);
	} else {
		// Otherwise, navigate to the search page.
		navigate(SEARCH_URL + encodeURI(input));
	}
});
