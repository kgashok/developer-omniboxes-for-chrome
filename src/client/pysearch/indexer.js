var Indexer = function(indexData) {
	this.indexData = indexData;
	this.resultsCache = this.newResultsCache(this.indexData);
	this.lastQuery = "";
	this.maxItems = 10;
};

// Create a new results cache
Indexer.prototype.newResultsCache = function(indexData) {
	keys = [];
	for (var key in indexData) {
		if (indexData.hasOwnProperty(key)) {
			keys.push(key);
		}
	}
	return [keys];
};

// Given two strings, return the length of the longest common prefix
Indexer.prototype.commonPrefixLength = function(a, b) {
	for (var i = 0; i < a.length && i < b.length; i++) {
		if (a[i] !== b[i]) break;
	}
	return i;
};

// Compute features for one item for ranking
Indexer.prototype.getItemFeatures = function(queryTokens, item) {
	var count = 0;                 // The number of distinct query tokens found
	var minTokenIndex = Infinity;  // The index at which the first query token is found
	// Iterate through the query tokens and compute
	// count (number of query tokens in the key)
	// minTokenIndex (position of first occurance of any query token)
	for (var i = 0; i < queryTokens.length; i++) {
		var tokenIndex = item.toLowerCase().indexOf(queryTokens[i].toLowerCase());
		if (tokenIndex !== -1) {
			count++;
			if (tokenIndex < minTokenIndex) minTokenIndex = tokenIndex;
		}
	}
	// The features are: the number of query tokens that do not occur in the key, the position of the first occurance
	// Smaller features => higher rank
	var itemFeatures = [queryTokens.length - count, minTokenIndex];
	return itemFeatures;
};

// Given a list of items and query tokens,
// returns a filtered list of items that contain all query tokens
Indexer.prototype.searchWithin = function(queryTokens, items) {
	return items.filter(function(item) {
		for (var i = 0; i < queryTokens.length; i++) {
			if (item.toLowerCase().indexOf(queryTokens[i].toLowerCase()) === -1 &&
					this.indexData[item].description.toLowerCase().indexOf(queryTokens[i].toLowerCase())) {
				return false;
			}
		}
		return true;
	});
};

// Return a ranked list of at most this.maxItems items
Indexer.prototype.rank = function(queryTokens, items) {
	var features = {};
	for (var i = 0; i < items.length; i++) {
		var item = items[i];
		features[item] = this.getItemFeatures(queryTokens, item);
	}
	var trimmedItems = this.trimResults(items.slice(), features);

	// Sort the itmes by features, then by lexographical order
	var rankedItems = trimmedItems.sort(function(a, b) {
		if (features[a] < features[b]) return -1;
		else if (features[a] > features[b]) return 1;
		else if (a < b) return -1;
		else if (a > b) return 1;
		else return 0;
	});

	// Truncate array to the maximum number of items
	var numItems = rankedItems.length < this.maxItems ? rankedItems.length : this.maxItems;
	return rankedItems.slice(0, numItems);
};

// Given a list of items and their features
// efficiently return a top-k sublist of size at least this.maxItem (if possible)
Indexer.prototype.trimResults = function(items, rankFeatures) {
	var filters = [];
	filters[0] = function(features) {
		return (features[1] === 0);
	};
	filters[1] = function(features) {
		return (features[2] < 16);
	};
	filters[2] = function(features) {
		return (features[2] < 8);
	};
	filters[3] = function(features) {
		return (features[2] < 4);
	};
	filters[4] = function(features) {
		return (features[2] < 2);
	};
	filters[5] = function(features) {
		return (features[2] < 1);
	};
	for (var i = 0; i < filters.length; i++) {
		// Apply the current filter
		var trimmed = [];
		for (var j = 0; j < items.length; j++) {
			if (filters[i](rankFeatures[items[j]])) {
				trimmed.push(items[j]);
			}
		}

		// Quit if this filter brings the number of items below the limit
		if (trimmed.length < this.maxItems) {
			return items;
		} else {
			items = trimmed;
		}
	}
	return items;
};

// Return a ranked list of items for the query
Indexer.prototype.search = function(query) {
	// If the query is empty, exit
	if (query === '') return [];

	// Get query tokens
	var queryTokens = query.split(/\s+/);

	// Retain the cache corresponding to the common prefix of
	// the cached query and the new query
	var startIndex = this.commonPrefixLength(query, this.lastQuery);
	this.resultsCache = this.resultsCache.slice(0, startIndex + 1);

	// Build the rest of cache for the new query
	for (var i = startIndex; i < query.length; i++) {
		console.log(this.resultsCache);
		this.resultsCache[i + 1] = this.searchWithin(queryTokens, this.resultsCache[i]);
	}
	this.lastQuery = query;

	// Retrieve and rank the results
	var results = this.resultsCache[query.length];
	var rankedResults = this.rank(queryTokens, this.resultsCache[query.length]);
	return rankedResults;
};
