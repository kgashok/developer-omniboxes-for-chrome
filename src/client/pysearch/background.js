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

// Prefetch necessary data
var predefined_ = {
	"glossary":"https://j.mp/pyGlossary", 
	"unit4":"https://j.mp/unit4Easy",
	"assert":"reference/simple_stmts.html#the-assert-statement",
	"pass":"reference/simple_stmts.html#the-pass-statement",
	"del":"reference/simple_stmts.html#the-del-statement",
	"return":"reference/simple_stmts.html#the-return-statement",
	"yield":"reference/simple_stmts.html#the-yield-statement",
	"raise":"reference/simple_stmts.html#the-raise-statement",
	"break":"reference/simple_stmts.html#the-break-statement",
	"continue":"reference/simple_stmts.html#the-continue-statement",
	"import":"reference/simple_stmts.html#the-import-statement",
	"future":"reference/simple_stmts.html#future-statements",
	"__future__":"reference/simple_stmts.html#future-statements",
	"global":"reference/simple_stmts.html#the-global-statement",
	"exec":"reference/simple_stmts.html#the-exec-statement",
	"if":"reference/compound_stmts.html#the-if-statement",
	"while":"reference/compound_stmts.html#the-while-statement",
	"for":"reference/compound_stmts.html#the-for-statement",
	"try":"reference/compound_stmts.html#the-try-statement",
	"except":"reference/compound_stmts.html#the-try-statement",
	"with":"reference/compound_stmts.html#the-with-statement",
	"def":"reference/compound_stmts.html#function-definitions",
	"class":"tutorial/classes.html#a-first-look-at-classes",
	"classes":"tutorial/classes.html#a-first-look-at-classes",
	"inheritance":"tutorial/classes.html#inheritance",
	"private":"tutorial/classes.html#private-variables",
	"encapsulation":"tutorial/classes.html#private-variables",
	"private variables":"tutorial/classes.html#private-variables",
	"double underscore":"tutorial/classes.html#private-variables",
	"and":"library/stdtypes.html#boolean-operations-and-or-not",
	"or":"library/stdtypes.html#boolean-operations-and-or-not",
	"not":"library/stdtypes.html#boolean-operations-and-or-not",
	"<":"library/stdtypes.html#comparisons",
	"<=":"library/stdtypes.html#comparisons",
	">":"library/stdtypes.html#comparisons",
	">=":"library/stdtypes.html#comparisons",
	"==":"library/stdtypes.html#comparisons",
	"!=":"library/stdtypes.html#comparisons",
	"is":"library/stdtypes.html#comparisons",
	"is not":"library/stdtypes.html#comparisons",
	"int":"library/stdtypes.html#numeric-types-int-float-complex",
	"float":"library/stdtypes.html#numeric-types-int-float-complex",
	"complex":"library/stdtypes.html#numeric-types-int-float-complex",
	"iterator":"library/stdtypes.html#iterator-types",
	"str":"library/stdtypes.html#string-methods",
	"object":"reference/datamodel.html#objects-values-and-types",
	"__slots__":"reference/datamodel.html#slots",
	"__metaclass__":"reference/datamodel.html#customizing-class-creation",
	"metaclass":"reference/datamodel.html#customizing-class-creation",
	"metaclasses":"reference/datamodel.html#customizing-class-creation"
};

// Event handler for when user input is received.
chrome.omnibox.onInputChanged.addListener(function(input, suggest) {
	// Get results from the indexer.
	var results = indexer.search(input);

	// Format the results for display.
	var suggestions = [];

	for (var key in predefined_) {
		if (key.startsWith(input)) {
			var url = "http://docs.python.org/3/" + predefined_[key];
			if(predefined_[key].startsWith("https:")) { 
				url = predefined_[key];
			}
			suggestions.push({"content":url, "description":["<match>", key, "</match> - <url>", url, "</url>"].join('')});
			//if (suggestions.length > kMaxSuggestions) {
			//	break;
			//}
		}
	}

	for (var i = 0; i < results.length; i++) {
		var result = results[i];
		console.log(result)
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
	//console.log("Input", input);
	// Check if an exact match exists for the current input.
	if (typeof(input) === "string" && input.startsWith("http") ) {
		navigate(input);
	}	
	else if (typeof indexData[input] === "object" ) {
		// If an exact match exists, navigate to the entry URL.
		navigate(ROOT_URL + indexData[input].url);
	} else {
		// Otherwise, navigate to the search page.
		navigate(SEARCH_URL + encodeURI(input));
	}
});
