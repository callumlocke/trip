'use strict';

var chalk = require('chalk');

var trip = {
  log: function () {
    var date = new Date(),
        hh = date.getHours() + '',
        mm = date.getMinutes() + '',
        ss = date.getSeconds() + '';

    if (hh.length < 2) hh = '0' + hh;
    if (mm.length < 2) mm = '0' + mm;
    if (ss.length < 2) ss = '0' + ss;

    console.log(
      chalk.gray('[' + hh + ':' + mm + ':' + ss + ']'),
      Array.prototype.slice.call(arguments).join(' ')
    );
  }
};

module.exports = trip;
