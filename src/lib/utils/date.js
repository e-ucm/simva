//const Duration = require('tinyduration');

/**
 * 
 * @returns 
 */
function now() {
    return new Date();
}

/**
 * 
 * @returns 
 */
function epoch() {
    return new Date(0);
}

/**
 * 
 * @param {string} strDate 
 * @returns 
 */
function parseDate(strDate) {
    const millis = Date.parse(strDate);
    return new Date(millis);
}

/**
 * 
 * @param {Date} start 
 * @param {Date} end 
 * 
 * @returns {number}
 */
function duration(start, end) {
    const endMillis = end.getTime();
    const startMillis = start.getTime();
    return endMillis - startMillis +1;
}

const MILLIS_TO_SECONDS = 1000;
const MILLIS_TO_MINUTES = 60 * MILLIS_TO_SECONDS;
const MILLIS_TO_HOURS = 60 * MILLIS_TO_MINUTES;
const MILLIS_TO_DAYS = 24 * MILLIS_TO_HOURS;
const MILLIS_TO_MONTHS = 30 * MILLIS_TO_DAYS;
const MILLIS_TO_YEARS = 12 * MILLIS_TO_MONTHS;

/**
 * 
 * @param {number} durationMillis 
 * @returns {string}
 */
function formatDuration(durationMillis) {
    const duration = {};

    let value = Math.floor(durationMillis / MILLIS_TO_YEARS);
    durationMillis = durationMillis % MILLIS_TO_YEARS;
    duration.years = value;

    value = Math.floor(durationMillis / MILLIS_TO_MONTHS);
    durationMillis = durationMillis % MILLIS_TO_MONTHS;
    duration.months = value;

    value = Math.floor(durationMillis / MILLIS_TO_DAYS);
    durationMillis = durationMillis % MILLIS_TO_DAYS;
    duration.days = value;

    value = Math.floor(durationMillis / MILLIS_TO_HOURS);
    durationMillis = durationMillis % MILLIS_TO_HOURS;
    duration.hours = value;

    value = Math.floor(durationMillis / MILLIS_TO_MINUTES);
    durationMillis = durationMillis % MILLIS_TO_MINUTES;
    duration.minutes = value;

    value = Math.floor(durationMillis / MILLIS_TO_SECONDS);
    durationMillis = durationMillis % MILLIS_TO_SECONDS;
    duration.seconds = value;

    return Duration.serialize(duration);
}

/**
 * 
 * @param {number} durationMin 
 * @returns {string}
 */
function convertTimeToCron(durationMin) {
    if (durationMin <= 0) {
        throw new Error("Time should be greater than 0.");
    }

    if (durationMin < 60) {
        return `*/${durationMin} * * * *`; // Runs every N minutes
    }

    const hours = Math.floor(durationMin / 60);
    const extraMinutes = durationMin % 60;

    if (hours < 24) {
        let cronExpressions = [`0 */${hours} * * *`]; // Runs every X hours
        if (extraMinutes > 0) {
            cronExpressions.push(`${extraMinutes} */${hours} * * *`); // Extra minute offset
        }
        return cronExpressions.join("\n");
    }

    const days = Math.floor(hours / 24);
    const extraHours = hours % 24;

    if (days < 7) {
        let cronExpressions = [`0 0 */${days} * *`]; // Runs every X days
        if (extraHours > 0) {
            cronExpressions.push(`0 */${extraHours} * * *`); // Extra hourly offset
        }
        return cronExpressions.join("\n");
    }

    const weeks = Math.floor(days / 7);
    const extraDays = days % 7;

    if (weeks < 4) {
        let cronExpressions = [`0 0 * */${weeks} *`]; // Runs every X weeks
        if (extraDays > 0) {
            cronExpressions.push(`0 0 */${extraDays} * *`); // Extra daily offset
        }
        return cronExpressions.join("\n");
    }

    const months = Math.floor(weeks / 4);
    const extraWeeks = weeks % 4;

    let cronExpressions = [`0 0 1 */${months} *`]; // Runs every X months
    if (extraWeeks > 0) {
        cronExpressions.push(`0 0 * */${extraWeeks} *`); // Extra weekly offset
    }

    return cronExpressions.join("\n");
}

/**
 * 
 * @param {string} isoStart
 * @param {string} isoEnd
 * @returns {string}
 */
function isoToDuration(isoStart, isoEnd) {
  const start = new Date(isoStart);
  const end = new Date(isoEnd);

  // Calculate the difference in milliseconds
  const diffMs = Math.abs(end - start);

  // Convert milliseconds to hours, minutes and seconds
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  // Format as ISO duration (PT format)
  return `PT${hours}H${minutes}M${seconds}S`;
}

module.exports = { now, convertTimeToCron , isoToDuration };