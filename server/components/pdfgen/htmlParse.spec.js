/* globals describe, it */

const expect = require('chai').expect;
const htmlParse = require('./htmlParse');

describe('HTMLParse to generate pdf: ', () => {
  it('Parses single DIV', () => {
    const div = htmlParse('<div>Yogesum Here</div>');
    expect(div).to.be.an('array');
    expect(div[0]).to.be.an('object');
    expect(div[0].text).to.equal('Yogesum Here');
  });

  it('Parses muliple parallel DIV', () => {
    const div = htmlParse('<div>Yogesum Here</div><div>Yogesum There</div>');
    expect(div).to.be.an('array');
    expect(div).to.have.lengthOf(2);
    expect(div[0].text).to.equal('Yogesum Here');
    expect(div[1].text).to.equal('Yogesum There');
  });

  it('Parses single Ordered List', () => {
    const ol = htmlParse('<ol><li>1</li><li><b>3</b></li><li>3</li></ol>');
    expect(ol).to.be.an('array');
    expect(ol).to.have.lengthOf(1);
    expect(ol[0].ol).to.have.lengthOf(3);
    expect(ol[0].ol[0]).to.contain.keys(['text']);
    expect(ol[0].ol[1]).to.contain.keys(['text', 'bold']);
    expect(ol[0].ol[2]).to.contain.keys(['text']);
  });
});
