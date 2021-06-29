const fs = require('fs');
const glob = require('glob');
const ipaInfo = require('./common/ipa-info');

const apps_dir = '/media/benni/storage2/tmp/3u';

const getIdentifier = (path) => ipaInfo(path).then((i) => (i.length === 1 ? i[0].CFBundleIdentifier : process.exit(1)));

(async () => {
    const ipas = glob.sync(`${apps_dir}/*.ipa`, { absolute: true });
    for (const ipa of ipas) {
        const identifier = await getIdentifier(ipa);
        console.log('Renaming', ipa, 'to', identifier);
        fs.renameSync(ipa, `${apps_dir}/${identifier}.ipa`);
    }
})();
