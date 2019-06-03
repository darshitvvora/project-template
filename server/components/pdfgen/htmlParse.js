const he = require('he');
const himalaya = require('himalaya');

function isList({ tagName = '' }) {
  return ['ol', 'ul', 'li'].indexOf(tagName.toLowerCase()) > -1;
}

function isText(elem) {
  return elem.type === 'Text' && elem.content.trim();
}

function parse(json, obj) {
  const block = obj || { text: [] };
  if (Array.isArray(json)) {
    return json.length === 1 ? parse(json[0], block) : json.map(x => parse(x), block);
  }

  if (json.type === 'Element') {
    const tagName = json.tagName.toLowerCase();

    switch (tagName) {
      case 'h1':
      case 'h2':
        block.style = 'medium';
        break;

      case 'h3':
      case 'h4':
        block.style = 'small';
        break;

      case 'h5':
      case 'h6':
        block.style = 'xsmall';
        break;

      case 'p':
        block.margin = [0, 4];
        break;

      case 'ol':
        delete block.text;
        block.ol = [];
        json.children.forEach((li) => {
          if (isList(li) || isText(li)) return block.ol.push(parse(li, { margin: [0, 3] }));
          return parse(li, block);
        });
        return block;

      case 'ul':
        delete block.text;
        block.ul = [];
        json.children.forEach((li) => {
          if (isList(li) || isText(li)) return block.ul.push(parse(li, { margin: [0, 3] }));
          return parse(li, block);
        });
        return block;

      case 'b':
      case 'strong':
        block.bold = true;
        break;

      case 'i':
      case 'em':
        block.italics = true;
        break;

      case 'u':
        block.decoration = 'underline';
        break;
      default:
        break;
    }

    if (Array.isArray(json.children)) return parse(json.children, block);
  }

  if (isText(json)) block.text = he.decode(json.content.trim());
  return block;
}

module.exports = (html) => {
  const json = himalaya.parse(html);
  if (json.length > 1) return parse(json);
  return [parse(json)]; // if there is single root node
};
