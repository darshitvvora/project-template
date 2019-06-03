const fs = require('fs');
const PdfPrinter = require('pdfmake');
const htmlParse = require('./htmlParse');

function mp(type) {
  return `${__dirname}/../../../node_modules/roboto-fontface/fonts/Roboto/Roboto-${type}.ttf`;
}

const printer = new PdfPrinter({
  Roboto: {
    normal: mp('Regular'),
    bold: mp('Medium'),
    italics: mp('RegularItalic'),
    bolditalics: mp('BoldItalic'),
  },
});

function addDetail(label, value) {
  return {
    text: [
      { text: `${label} - `, style: 'small', bold: true },
      `${value}`,
    ],
    margin: [0, 1],
  };
}

/**
 * Insert job content in pdf
 *   @todo  add website and app links
 * @param {Object} job     Solr data of job
 * @param {Array} content  PDF content
 */
function addContent(job, content) {
  const doc = content;
  const linebreak = { text: ' ', style: 'small' };

  if (job.role) doc.push({ text: job.role, style: 'medium' });

  if (job.job_location) doc.push(addDetail('Location', `${job.job_location}`));

  if (job.min_exp && job.max_exp) {
    doc.push(addDetail('Experience', `${job.min_exp} - ${job.max_exp} Years`));
  }

  if (job.functional_area) {
    doc.push({ text: job.functional_area, style: 'xsmall', color: '#aaa' });
  }

  doc.push(linebreak);

  if (job.org) {
    doc.push(linebreak);
    doc.push({ text: 'About Company', style: 'subheader' });
    doc.push(linebreak);

    if (job.org.short_description || job.about_company) {
      doc.push({ text: job.qrex_client_name ? job.about_company : job.org.short_description });
      doc.push(linebreak);
    }

    doc.push({ text: `(${job.org.min_emp} - ${job.org.max_emp} employees)` });
    doc.push(linebreak);
    doc.push(linebreak);
  }

  if (job.vacancy) {
    doc.push({
      text: [{ text: 'Vacancy: ', style: 'subheader' }, `${job.vacancy}`],
      margin: [0, 1],
    });
    doc.push(linebreak);
  }
  if (job.perks) {
    doc.push(linebreak);
    doc.push({
      text: 'Perks, Incentives, ESOPs & Compensation details',
      style: 'subheader',
    });

    htmlParse(job.perks).map(r => doc.push(r));
  }

  if (job.responsibility) {
    doc.push(linebreak);
    doc.push({ text: 'Job Description', style: 'subheader' });
    htmlParse(job.responsibility).map(r => doc.push(r));
  }

  if (
    (job.required_skills && job.required_skills.length > 0) ||
    (job.optional_skills && job.optional_skills.length > 0)
  ) {
    doc.push(linebreak);
    doc.push({ text: 'Skills', style: 'subheader' });
  }

  if (job.required_skills && job.required_skills.length > 0) {
    doc.push({ text: 'Must have', bold: true });
    doc.push({ text: job.required_skills.join(', ') });
    doc.push(linebreak);
  }

  if (job.optional_skills && job.optional_skills.length > 0) {
    doc.push({ text: 'Optional', bold: true });
    doc.push({ text: job.optional_skills.join(', ') });
  }

  if (job.degrees && job.degrees.length > 0) {
    doc.push(linebreak);
    doc.push({ text: 'Qualifications', style: 'subheader' });
    doc.push({ text: job.degrees.join(', ') });
  }

  if (job.days_per_week) {
    doc.push(linebreak);
    const work = [];
    doc.push({ text: 'Working Days', style: 'subheader' });
    work.push({ text: `${job.days_per_week} Days a week ` });
    if (job.start_work_time && job.end_work_time) {
      work.push({ text: `(${job.start_work_time} to ${job.end_work_time})` });
    }

    doc.push({ text: work });
  }

  if (job.job_nature) {
    doc.push(linebreak);
    doc.push({ text: 'Job Nature', style: 'subheader' });
    doc.push({ text: job.job_nature });
  }

  return doc;
}

module.exports = (job, location) => {
  const header = { columns: ['', '', {
    image: `${__dirname}/../../logo.png`, width: 100,
  }] };

  const note = [
    { text: '      •'.concat(Array(105).map(() => '    ').join('    ')),
      background: '#ffe4e4',
      fontSize: 5,
      color: '#ffe4e4',
    },
    { text: '   NOTE:  '.concat(Array(98).map(() => '  ').join('  ')),
      bold: true,
      background: '#ffe4e4',
    },
    {
      text: [
        { text: '   • ', bold: true },
        'QuezX JDs are ',
        { text: 'NOT ', bold: true },
        ' to be posted on Job Portals/Social Media   '.concat(Array(46).map(() => '  ').join('  ')),
        { text: ' ', fontSize: 9 },
      ],
      background: '#ffe4e4',
    },
    {
      text: [
        { text: '   • ', bold: true },
        { text: 'NO ', bold: true },
        ' Company Name and ',
        { text: 'NO ', bold: true },
        'CTC should be sent to candidates via emails/mass emails'.concat(Array(25)
          .map(() => '  ')
          .join('  ')),
        { text: '  ', fontSize: 9 },
      ],
      background: '#ffe4e4',
    },
    {
      text: [
        { text: '   • ', bold: true },
        'Any violation will result in  ',
        { text: 'BLACKLISTING   '.concat(Array(64).map(() => '  ').join('  ')), bold: true },
        { text: ' ', fontSize: 10 },
      ],
      background: '#ffe4e4',
    },
    {
      text: '      •'.concat(Array(105)
        .map(() => '    ')
        .join('    ')),
      background: '#ffe4e4',
      fontSize: 5,
      color: '#ffe4e4',
    },
    { text: ' ', fontSize: 5 },
  ];

  const pdfDoc = printer.createPdfKitDocument({
    content: addContent(job, [note, header]),
    styles: {
      large: { fontSize: 18, bold: true, margin: [0, 2] },
      medium: { fontSize: 16, bold: true, margin: [0, 2] },
      small: { fontSize: 11, margin: [0, 1] },
      xsmall: { fontSize: 10, margin: [0, 3] },
      subheader: { fontSize: 12, color: '#999', bold: true, margin: [0, 3] },
      black: { color: '#222' },
    },
    defaultStyle: { color: '#444', fontSize: 10 },
  });

  return new Promise((resolve, reject) => {
    pdfDoc
      .pipe(fs.createWriteStream(location))
      .on('finish', resolve)
      .on('error', reject);

    pdfDoc.end();
  });
};
