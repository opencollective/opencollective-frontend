#!/usr/bin/env node

// Only run on the first of the month
const today = new Date();
if (process.env.NODE_ENV === 'production' && today.getDate() !== 4 && today.getMonth() !== 0) {
  console.log('NODE_ENV is production and today is not the first of the first month of the year, script aborted!');
  process.exit();
}

process.env.PORT = 3066;

import HostReport from '../../reports/host-report';

const d = new Date;
const year = (new Date(d.getFullYear() - 1, 1, 1)).getFullYear();
HostReport(year)