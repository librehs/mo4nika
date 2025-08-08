"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const mocha_1 = require("mocha");
const chai_1 = require("chai");
const textEntities_1 = tslib_1.__importStar(require("./textEntities"));
const msg = {
    caption: 'test bold italic underline\n' +
        'test link\n' +
        'test console.log\n' +
        'test\n' +
        'console.log("test")\n' +
        'console.log("tset")\n' +
        '\n' +
        '#a #b #c #hashes',
    caption_entities: [
        { offset: 5, length: 4, type: 'bold' },
        { offset: 10, length: 6, type: 'italic' },
        { offset: 17, length: 10, type: 'underline' },
        {
            offset: 32,
            length: 5,
            type: 'text_link',
            url: 'https://bing.com/',
        },
        { offset: 42, length: 12, type: 'code' },
        { offset: 59, length: 41, type: 'code' },
        { offset: 100, length: 2, type: 'hashtag' },
        { offset: 103, length: 2, type: 'hashtag' },
        { offset: 106, length: 2, type: 'hashtag' },
        { offset: 109, length: 7, type: 'hashtag' },
    ],
    target: {
        md: 'test <b>bold</b> <i>italic</i> underline\n' +
            'test [link](<https://bing.com/>)\n' +
            'test `console.log`\n' +
            'test\n' +
            '```\n' +
            'console.log("test")\n' +
            'console.log("tset")\n' +
            '```\n' +
            '\n' +
            '#a #b #c #hashes',
        tags: ['a', 'b', 'c', 'hashes'],
    },
};
const urlTextLinkMsg = {
    caption: 'p1 https://t.co/a b/\np2 t.tt\np3 sample\np4 sample',
    caption_entities: [
        { offset: 3, length: 17, type: 'url' },
        { offset: 24, length: 4, type: 'url' },
        { offset: 32, length: 7, type: 'text_link', url: 'http://t.tt/' },
        { offset: 42, length: 6, type: 'text_link', url: 'https://t.tt/' },
    ],
    target: {
        md: 'p1 [https://t.co/a b/](<https://t.co/a%20b/>)\n' +
            'p2 [t.tt](<http://t.tt>)\n' +
            'p3 [sample](<http://t.tt/>)\n' +
            'p4 [sample](<https://t.tt/>)',
        md_disabledTypes: 'p1 [https://t.co/a b/](<https://t.co/a%20b/>)\n' +
            'p2 [t.tt](<http://t.tt>)\n' +
            'p3 sample\n' +
            'p4 sample',
    },
};
(0, mocha_1.describe)('parseTextEntities', () => {
    (0, mocha_1.it)('can parse mixed text', () => {
        const ret = (0, textEntities_1.default)(msg.caption, msg.caption_entities);
        (0, chai_1.expect)(ret.md).to.be.deep.eq(msg.target.md);
        (0, chai_1.expect)(ret.tags).to.be.eq(ret.tags);
    });
    (0, mocha_1.it)('can parse url and text_link', () => {
        const ret = (0, textEntities_1.default)(urlTextLinkMsg.caption, urlTextLinkMsg.caption_entities);
        (0, chai_1.expect)(ret.md).to.be.deep.eq(urlTextLinkMsg.target.md);
    });
    (0, mocha_1.it)('respects disabledTypes', () => {
        const ret = (0, textEntities_1.default)(urlTextLinkMsg.caption, urlTextLinkMsg.caption_entities, ['text_link']);
        (0, chai_1.expect)(ret.md).to.be.deep.eq(urlTextLinkMsg.target.md_disabledTypes);
    });
});
(0, mocha_1.describe)('parseHeaders', () => {
    (0, mocha_1.it)('basic test', () => {
        (0, chai_1.expect)((0, textEntities_1.parseHeaders)('Foo: Bar')).to.be.deep.eq({ foo: 'Bar' });
        (0, chai_1.expect)((0, textEntities_1.parseHeaders)('Foo: Bar\nFoo: Baz')).to.be.deep.eq({ foo: 'Baz' });
        (0, chai_1.expect)((0, textEntities_1.parseHeaders)('CVE-ID: CVE-2021-12345\nCVSS: 8.3')).to.be.deep.eq({
            'cve-id': 'CVE-2021-12345',
            cvss: '8.3',
        });
        (0, chai_1.expect)((0, textEntities_1.parseHeaders)('Never Gonna: Give You Up')).to.be.deep.eq({});
        (0, chai_1.expect)((0, textEntities_1.parseHeaders)('Never-Gonna: Give You Up')).to.be.deep.eq({
            'never-gonna': 'Give You Up',
        });
        (0, chai_1.expect)((0, textEntities_1.parseHeaders)('G-co: [gco](https://g.co)')).to.be.deep.eq({
            'g-co': '[gco](https://g.co)',
        });
    });
});
