#!/usr/bin/env node

// Only run on the first of the month
const today = new Date();
if (
  process.env.NODE_ENV === 'production' &&
  today.getDate() !== 1 &&
  !process.env.OFFCYCLE
) {
  console.log(
    'NODE_ENV is production and today is not the first of month, script aborted!',
  );
  process.exit();
}

process.env.PORT = 3066;

import HostReport from '../../reports/host-report';

const d = new Date();
let year = process.env.YEAR;
const hostId = process.env.HOST_ID;
if (process.env.YEARLY_REPORT) {
  year = year || new Date(d.getFullYear() - 1, 1, 1).getFullYear();
  HostReport(year, null, hostId);
} else {
  const rd = new Date(d.getFullYear(), d.getMonth() - 1);
  HostReport(rd.getFullYear(), rd.getMonth(), hostId);
}
