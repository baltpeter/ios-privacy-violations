const pause = (duration_in_ms) => new Promise((res) => setTimeout(res, duration_in_ms));

// Inspired by: https://www.leeholmes.com/searching-for-content-in-base-64-strings/
const base64Regex = (input) => {
    const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input);
    const encodings = [
        buffer.toString('base64'),
        Buffer.concat([Buffer.alloc(1), buffer])
            .toString('base64')
            .substr(2),
        Buffer.concat([Buffer.alloc(2), buffer])
            .toString('base64')
            .substr(4),
    ].map((e) => e.replace(/.==?$/, ''));

    return `(${encodings.sort().join('|')})`;
};

module.exports = { pause, base64Regex };
