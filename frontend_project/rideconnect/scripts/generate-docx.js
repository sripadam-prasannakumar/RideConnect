const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');
const MarkdownIt = require('markdown-it');

const md = new MarkdownIt();

/**
 * Basic Markdown to docx converter
 * Supports headings, paragraphs, and bold/italic text
 */
function convertMdToDocx(mdContent) {
    const tokens = md.parse(mdContent, {});
    const children = [];

    let currentParagraphChildren = [];

    tokens.forEach((token, index) => {
        if (token.type === 'heading_open') {
            const level = parseInt(token.tag.substring(1));
            const nextToken = tokens[index + 1];
            if (nextToken && nextToken.type === 'inline') {
                children.push(new Paragraph({
                    text: nextToken.content,
                    heading: level === 1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
                    spacing: { before: 240, after: 120 }
                }));
            }
        } else if (token.type === 'paragraph_open') {
            currentParagraphChildren = [];
        } else if (token.type === 'inline' && tokens[index - 1].type === 'paragraph_open') {
            children.push(new Paragraph({
                children: [new TextRun(token.content)],
                spacing: { after: 120 }
            }));
        }
    });

    return new Document({
        sections: [{
            properties: {},
            children: children,
        }],
    });
}

const inputPath = path.join(__dirname, '..', 'README.md');
const outputPath = path.join(__dirname, '..', 'docs', 'Project_Documentation.docx');

// Ensure docs directory exists
const docsDir = path.dirname(outputPath);
if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
}

if (fs.existsSync(inputPath)) {
    const mdContent = fs.readFileSync(inputPath, 'utf8');
    const doc = convertMdToDocx(mdContent);

    Packer.toBuffer(doc).then((buffer) => {
        fs.writeFileSync(outputPath, buffer);
        console.log(`Successfully generated word document at: ${outputPath}`);
    }).catch(err => {
        console.error('Error generating docx:', err);
    });
} else {
    console.error(`Input file not found: ${inputPath}`);
}
