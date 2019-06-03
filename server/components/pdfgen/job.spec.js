const fsp = require('fs-promise');
const path = require('path');
const pdfgen = require('./job');

fsp.readdir(__dirname)
  .then(files => files
    .filter(filename => (filename.split('.').pop().toLowerCase() === 'json'))
    .map(filename => fsp
      .readFile(path.join(__dirname, filename), 'utf-8')
      .then(content => pdfgen(
        JSON.parse(content),
        `${__dirname}/../../../logs/${filename}.pdf`,
      )),
    ));
