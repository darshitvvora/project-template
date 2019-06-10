
const moment = require('moment');

const QUtil = {
  getRangeFolder(id) {
    return (id - (id % 10000)).toString();
  },

  floorToPrecision(value, precision) {
    return Math.floor(value * (10 ** precision)) / (10 ** precision);
  },

  getFinancialYear(date = null) {
    const m = +moment(date).format('M');
    const yy = +moment(date).format('YY');
    const financialYear = (m <= 3) ? `${yy - 1}-${yy}` : `${yy}-${yy + 1}`;

    return financialYear;
  },
};

module.exports = QUtil;
