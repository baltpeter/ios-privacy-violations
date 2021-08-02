const path = require('path');
const fs = require('fs');
const { base64Regex } = require('./util');

const getRequestsForIndicator = async (db, strings, bundle_id = undefined) => {
    const raw_conditions = strings.map(
        (s) => `content ILIKE '%${s}%' OR content_raw LIKE '%${s}%' OR path ILIKE '%${s}%'`
    );
    const base64_conditions = strings.map((s) => base64Regex(s)).map((r) => `content ~ '${r}' OR path ~ '${r}'`);
    const name_filter = bundle_id ? `name = '${bundle_id}'` : 'True';
    const query = `SELECT name, fr.id from apps join runs on apps.name = runs.app join filtered_requests fr on runs.id = fr.run
    WHERE ${name_filter} AND (${[...raw_conditions, ...base64_conditions].join('\n       OR ')});`;
    return await db.manyOrNone(query);
};

const getTrackingFilterlist = () =>
    fs
        .readdirSync(path.join(__dirname, 'filterlists'))
        .filter((p) => p.endsWith('.txt'))
        .map((p) => path.join(__dirname, 'filterlists', p))
        .map((p) => fs.readFileSync(p, 'utf-8'))
        .map((l) =>
            l
                .split('\n')
                .filter((r) => r)
                .filter((r) => !r.startsWith('#'))
                .map((l) => (l.includes(' ') ? l.split(' ')[1] : l))
        )
        .flat();

const privacy_label_indicators = {
    Name: ['Frank', 'Walther'],
    'Email Address': [
        'frank.walther.1978',
        '3CFD8703E1C42CCF47D1BED9DCD4F9D4',
        '0868F34F3A63FE5DDEAEBA28E983BC66720CC0C1',
        'DD82618256687076D3E707E9CCA936FB535BA6A7F8DF012EF3F64EEC1B9CDBD6',
        'D549A4152B6A3652F6D77C65F5D2578EC1046DC4408BA2792588A0CF68B09482CFA0E15F47ACE75957DAB60DF64ECA02869944C8AF710922E57A4BE5294E58C7',
        'CF71BFFFEBC3AE1309252839DAF6377E3A6121AB642D65F70F8BDA385D08E2157BB594C0315B278AA9B883ADA7ACC85CED50B4D6A993C14E0268624A863BD64D',
    ],
    Health: ['DkwIXobsJN', 't5TfTlezmn', '108.5'],
    'Precise Location': ['52.235', '10.564', 'chreinerweg'],
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

module.exports = { getRequestsForIndicator, getTrackingFilterlist, privacy_label_indicators };
