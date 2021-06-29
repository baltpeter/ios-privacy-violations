const fs = require('fs');
const _ipaInfo = require('ipa-extract-info');

const ipaInfo = (path) =>
    new Promise(async (res, rej) => {
        const fd = fs.openSync(path, 'r');
        _ipaInfo(fd, (err, data) => {
            if (err) rej(err);
            res(data);
        });
    });

module.exports = ipaInfo;
