"use strict";

const anyIntersection = require("./anyIntersection");
const fill = require("./fill");

// Merge text part information within a styling fragment
function assign(textPart, fragment) {
	const fragStart = fragment.start;
	const start = Math.max(fragment.start, textPart.start);
	const end = Math.min(fragment.end, textPart.end);
	const text = fragment.text.slice(start - fragStart, end - fragStart);

	return Object.assign({}, fragment, {start, end, text});
}

function sortParts(a, b) {
	return a.start - b.start || b.end - a.end;
}

// Merge the style fragments within the text parts, taking into account
// boundaries and text sections that have not matched to links or channels.
// For example, given a string "foobar" where "foo" and "bar" have been
// identified as parts (channels, links, etc.) and "fo", "ob" and "ar" have 3
// different styles, the first resulting part will contain fragments "fo" and
// "o", and the second resulting part will contain "b" and "ar". "o" and "b"
// fragments will contain duplicate styling attributes.
function merge(textParts, styleFragments, cleanText) {
	// Every section of the original text that has not been captured in a "part"
	// is filled with "text" parts, dummy objects with start/end but no extra
	// metadata.
	const allParts = textParts
		.sort(sortParts) // Sort all parts identified based on their position in the original text
		.concat(fill(textParts, cleanText))
		.sort(sortParts) // Sort them again after filling in unstyled text
		.reduce((prev, curr) => {
			const intersection = prev.some((p) => anyIntersection(p, curr));

			if (intersection) {
				return prev;
			}

			return prev.concat([curr]);
		}, []);

	// Distribute the style fragments within the text parts
	return allParts.map((textPart) => {
		textPart.fragments = styleFragments
			.filter((fragment) => anyIntersection(textPart, fragment))
			.map((fragment) => assign(textPart, fragment));

		return textPart;
	});
}

module.exports = merge;
