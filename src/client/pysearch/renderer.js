var Renderer = function() {
	this.startTag = "<match>";   // Opening highlight tag
	this.endTag = "</match>";    // Closing highlight tag
	this.maxLength = 256;        // Maximum length for description
};

// Find all the query token hits and build the bitmask
Renderer.prototype.getBitMask = function(query, text) {
	var bitMask = [];
	var queryTokens = query.split(/\s+/);
	// Iterate over query queryTokens
	for (var i = 0; i < queryTokens.length; i++){
		var queryToken = queryTokens[i];
		// Iterate over matches for current query token
		for (var cursor = text.toLowerCase().indexOf(queryToken.toLowerCase());
				cursor !== -1;
				cursor = text.toLowerCase().indexOf(queryToken.toLowerCase(), cursor + queryToken.length)) {
			// Set bit for all characters within match
			for (var j = 0; j < queryToken.length; j++) {
				bitMask[cursor + j] = true;
			}
		}
	}
	return bitMask;
};

// Given text and a query,
// return the text with all occurrences highlighted
Renderer.prototype.addTags = function(query, text) {
	var bitMask = this.getBitMask(query, text);

	// Perform XML escaping
	var xmlSpecial = ["&", "<", ">", "\"", "'"];
	var xmlEntities = {
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		"\"": "&quot;",
		"'": "&apos;"
	};
	// Iterate through the special characters
	for (var i = 0; i < xmlSpecial.length; i++) {
		var target = xmlSpecial[i];
		for (var cursor = text.indexOf(target, cursor);
				cursor !== -1;
				cursor = text.indexOf(target, cursor + xmlEntities[target].length)) {
			// Replace special character with entities
			text = text.substring(0, cursor) + xmlEntities[target] + text.substring(cursor + target.length);
			for (j = 0; j < xmlEntities[target].length - 1; j++) {
				bitMask.splice(cursor, 0, bitMask[cursor]);
			}
			console.log(text);
		}
	}

	var highlightedText = "";  // Output text
	var highlighted = false;   // Highlighted state of current character
	var substrStart = 0;       // Position of last state transition

	// Iterate over all characters, adding the character and inter-spaced tags to output
	for (var k = 0; k < text.length; k++) {
		if (!highlighted && bitMask[k]) {
			// Handle state transition to highlighted
			highlightedText += text.substring(substrStart, k) + this.startTag;
			highlighted = true;
			substrStart = k;
		} else if (highlighted && !bitMask[k]) {
			// Handle state transition to un-highlighted
			highlightedText += text.substring(substrStart, k) + this.endTag;
			highlighted = false;
			substrStart = k;
		}
	}
	// Insert tail closing tag if necessary
	highlightedText += text.substring(substrStart, text.length);
	if (highlighted) {
		highlightedText += this.endTag;
	}
	return highlightedText;
};

Renderer.prototype.render = function(query, key, description) {
//	return key;
	return this.addTags(query, key) +
		"<dim> - " +
		this.addTags(query, description.substr(0, this.maxLength)) +
		"</dim>";
};
