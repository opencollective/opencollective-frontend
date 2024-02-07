import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

// In-order to use certain functionality of dayjs, we need to import certain plugins and extend them to the dayjs object.

// adding utc plugin
dayjs.extend(utc);
// adding timezone plugin
dayjs.extend(timezone);
// adding isoWeek plugin
dayjs.extend(isoWeek);
// adding quarterOfYear plugin
dayjs.extend(quarterOfYear);

export default dayjs;
