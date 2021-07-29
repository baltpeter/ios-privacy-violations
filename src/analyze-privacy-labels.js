const path = require('path');
const fs = require('fs');
const glob = require('glob');
const { db } = require('./common/db');
const { getRequestsForIndicator } = require('./common/query');

const data_dir = path.join(__dirname, '..', 'data', 'privacy-labels');
const out_dir = path.join(__dirname, '..', 'data');

const indicators = {
    Name: ['Frank', 'Walther'],
    'Email Address': [
        'frank.walther.1978',
        '3CFD8703E1C42CCF47D1BED9DCD4F9D4',
        '0868F34F3A63FE5DDEAEBA28E983BC66720CC0C1',
        'DD82618256687076D3E707E9CCA936FB535BA6A7F8DF012EF3F64EEC1B9CDBD6',
        'D549A4152B6A3652F6D77C65F5D2578EC1046DC4408BA2792588A0CF68B09482CFA0E15F47ACE75957DAB60DF64ECA02869944C8AF710922E57A4BE5294E58C7',
        'CF71BFFFEBC3AE1309252839DAF6377E3A6121AB642D65F70F8BDA385D08E2157BB594C0315B278AA9B883ADA7ACC85CED50B4D6A993C14E0268624A863BD64D',
    ],
    'Physical Address': ['chreinerweg'],
    Health: ['DkwIXobsJN', 't5TfTlezmn', '108.5'],
    'Precise Location': ['52.235', '10.564'],
    'Coarse Location': ['52.23', '10.56'],
    Contacts: [
        'JGKfozntbF',
        'TBFFZbBYea',
        '57543434',
        'RYnlSPbEYh',
        'q8phlLSJgq',
        'N2AsWEMI5D',
        '859663',
        'p0GdKDTbYV',
    ],
    'Emails or Text Messages': ['9FBqD2CNIJ', '91377604'],
    'Device ID': ['00000000-0000-0000-0000-000000000000', 'idfa', 'idfv'],
};

(async () => {
    const jsons = glob
        .sync(`${data_dir}/*.json`, { absolute: true })
        .map((p) => ({ bundleId: path.basename(p, '.json'), ...require(p) }));
    const apps = jsons
        .filter((j) => j.data && !j.errors)
        .map((j) => ({ bundleId: j.bundleId, privacyTypes: j.data[0].attributes.privacyDetails.privacyTypes }));
    const no_data_apps = apps.filter(
        (a) => a.privacyTypes.length === 1 && a.privacyTypes[0].identifier === 'DATA_NOT_COLLECTED'
    );
    console.log(
        `${apps.length} of ${jsons.length} apps have valid privacy labels. Of those, ${no_data_apps.length} claim not to collect any data, namely:`,
        no_data_apps.map((a) => a.bundleId)
    );

    const category_instances = {};
    for (const app of apps) {
        const [purposes, dataCategories] = app.privacyTypes.reduce(
            (acc, cur) => {
                switch (cur.identifier) {
                    case 'DATA_NOT_COLLECTED':
                        break;
                    case 'DATA_USED_TO_TRACK_YOU':
                        acc[1] = [...new Set([...acc[1], ...cur.dataCategories.map((c) => c.dataTypes).flat()])];
                        break;
                    case 'DATA_LINKED_TO_YOU':
                    case 'DATA_NOT_LINKED_TO_YOU': // fallthrough intentional
                        acc[0] = [...new Set([...acc[0], ...cur.purposes.map((p) => p.purpose)])];
                        acc[1] = [
                            ...new Set([
                                ...acc[1],
                                ...cur.purposes.map((p) => p.dataCategories.map((c) => c.dataTypes).flat()).flat(),
                            ]),
                        ];
                        break;
                    default:
                        throw new Error('Invalid privacy type.');
                }
                return acc;
            },
            [[], []]
        );

        for (const [name, strings] of Object.entries(indicators)) {
            const requests = await getRequestsForIndicator(db, strings, app.bundleId);
            if (requests.length > 0) {
                if (!category_instances[app.bundleId]) category_instances[app.bundleId] = [];
                const ok =
                    name === 'Coarse Location'
                        ? dataCategories.includes(name) || dataCategories.includes('Precise Location')
                        : dataCategories.includes(name);
                category_instances[app.bundleId].push({ data_category: name, requests: requests.map((r) => r.id), ok });
                if (!ok)
                    console.log(
                        app.bundleId,
                        name,
                        requests.map((r) => r.id)
                    );
            }
        }
    }

    fs.writeFileSync(path.join(out_dir, 'privacy_label_categories.json'), JSON.stringify(category_instances, null, 4));
})();
