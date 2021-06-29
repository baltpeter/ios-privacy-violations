const pause = (duration_in_ms) => new Promise((res) => setTimeout(res, duration_in_ms));

module.exports = { pause };
