import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = join(__dirname, '..', 'pull_request_template.md');
const content = readFileSync(TEMPLATE_PATH, 'utf8');
const lines = content.split('\n');

// The changed line (0-indexed line 65 in the file, line 66 as displayed)
const TOPICS_LINE_INDEX = lines.findIndex(
	(line) => line.includes('awesome-list') && line.includes('awesome') && line.includes('GitHub topics')
);
const topicsLine = lines[TOPICS_LINE_INDEX];

describe('pull_request_template.md — GitHub topics link URL update', () => {
	describe('new URL is present', () => {
		test('file contains the updated help.github.com topics URL', () => {
			assert.ok(
				content.includes('https://help.github.com/articles/about-topics'),
				'Expected new URL "https://help.github.com/articles/about-topics" to be present in the file'
			);
		});

		test('topics link uses the new short help.github.com URL', () => {
			assert.ok(
				topicsLine.includes('https://help.github.com/articles/about-topics'),
				`Expected the topics checklist line to contain "https://help.github.com/articles/about-topics", got: "${topicsLine}"`
			);
		});
	});

	describe('old URL is absent', () => {
		test('file does not contain the old docs.github.com topics URL', () => {
			const oldUrl =
				'https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/classifying-your-repository-with-topics';
			assert.ok(
				!content.includes(oldUrl),
				`Expected old URL to be removed, but it was still found in the file`
			);
		});

		test('old and new URLs are not both present simultaneously (regression)', () => {
			const oldUrl =
				'https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/classifying-your-repository-with-topics';
			const newUrl = 'https://help.github.com/articles/about-topics';
			const hasOld = content.includes(oldUrl);
			const hasNew = content.includes(newUrl);
			assert.ok(
				!hasOld && hasNew,
				`Expected only the new URL to be present. Old present: ${hasOld}, new present: ${hasNew}`
			);
		});
	});

	describe('Markdown link syntax is correct', () => {
		test('topics link has correct Markdown syntax with new URL', () => {
			const expectedLink = '[GitHub topics](https://help.github.com/articles/about-topics)';
			assert.ok(
				content.includes(expectedLink),
				`Expected Markdown link "${expectedLink}" to be present in file`
			);
		});

		test('link text "GitHub topics" is preserved after URL change', () => {
			assert.ok(
				topicsLine.includes('[GitHub topics]'),
				`Expected link text "[GitHub topics]" to be preserved in: "${topicsLine}"`
			);
		});

		test('link is a valid Markdown inline link (brackets + parentheses)', () => {
			// Matches [text](url) pattern
			const markdownLinkPattern = /\[GitHub topics\]\(https:\/\/help\.github\.com\/articles\/about-topics\)/;
			assert.match(
				content,
				markdownLinkPattern,
				'Expected topics link to follow valid Markdown inline link syntax'
			);
		});
	});

	describe('checklist item structure is preserved', () => {
		test('topics requirement line is a checklist item', () => {
			assert.ok(
				TOPICS_LINE_INDEX !== -1,
				'Could not find the GitHub topics checklist line in the file'
			);
			assert.ok(
				topicsLine.trimStart().startsWith('- [ ]'),
				`Expected topics line to be an unchecked checklist item starting with "- [ ]", got: "${topicsLine}"`
			);
		});

		test('checklist item mentions both required GitHub topics', () => {
			assert.ok(
				topicsLine.includes('awesome-list'),
				`Expected checklist item to mention "awesome-list" topic`
			);
			assert.ok(
				topicsLine.includes('awesome'),
				`Expected checklist item to mention "awesome" topic`
			);
		});

		test('checklist item text after the URL change is unchanged', () => {
			// The visible text of the checklist item should still include the encouragement sentence
			assert.ok(
				topicsLine.includes('I encourage you to add more relevant topics'),
				`Expected trailing text "I encourage you to add more relevant topics" to remain in the line`
			);
		});

		test('the topics requirement line is located in the list requirements section', () => {
			// It should appear after "## Requirements for your Awesome list" heading
			const sectionIndex = lines.findIndex((line) =>
				line.includes('## Requirements for your Awesome list')
			);
			assert.ok(sectionIndex !== -1, 'Could not find "Requirements for your Awesome list" section');
			assert.ok(
				TOPICS_LINE_INDEX > sectionIndex,
				'Expected the GitHub topics line to appear inside the "Requirements for your Awesome list" section'
			);
		});
	});

	describe('boundary and negative cases', () => {
		test('new URL does not contain the old long path segments', () => {
			assert.ok(
				!content.includes('managing-your-repositorys-settings-and-features'),
				'Old URL path segment should not be present in the file'
			);
			assert.ok(
				!content.includes('classifying-your-repository-with-topics'),
				'Old URL path segment should not be present in the file'
			);
		});

		test('new URL ends exactly at the closing parenthesis with no trailing characters', () => {
			const linkPattern = /\[GitHub topics\]\((https:\/\/help\.github\.com\/articles\/about-topics)\)/;
			const match = content.match(linkPattern);
			assert.ok(match, 'Expected to find the GitHub topics link in the file');
			assert.equal(
				match[1],
				'https://help.github.com/articles/about-topics',
				'Captured URL should match exactly, with no trailing characters or fragments'
			);
		});

		test('exactly one GitHub topics link exists in the file', () => {
			const matches = content.match(/\[GitHub topics\]/g) ?? [];
			assert.equal(
				matches.length,
				1,
				`Expected exactly one "[GitHub topics]" link in the file, found ${matches.length}`
			);
		});
	});
});
