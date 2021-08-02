const fs = require('fs');
const path = require('path');
const { db } = require('./common/db');
const { getRequestsForIndicator, getTrackingFilterlist } = require('./common/query');

const out_dir = path.join(__dirname, '..', 'data');

const indicators = {
    contacts: [
        'Walther',
        'frank.walther',
        'JGKfozntbF',
        'TBFFZbBYea',
        '57543434',
        'RYnlSPbEYh',
        'q8phlLSJgq',
        'N2AsWEMI5D',
        '859663',
        'p0GdKDTbYV',
    ],
    location: ['chreinerweg', 'raunschweig', '52.235', '10.564'],
    messages: ['9FBqD2CNIJ', '91377604'],
    clipboard: ['LDDsvPqQdT'],
    calendar: ['fWAs4GFbpN', 'urscf2178L'],
    reminders: ['b5jHg3Eh1k', 'HQBOdx4kx2'],
    notes: ['S0Ei7sFP9b'],
    'health data': ['DkwIXobsJN', 't5TfTlezmn', '108.5'],
    'Apple Home data': ['bEZf1h06j1', 'DX7BgPtH99', 'g1bVNue3On'],
    SSID: ['ALTPETER'],
    BSSID: ['34:81:c4:dc:36:1'],
    'WiFi address': ['3C:CD:36:D4:CC:E4'],
    'Bluetooth address': ['3C:CD:36:D2:BD:B2'],
    'device name': ['R2Gl5OLv20'],
    'OS version': ['14.5.1'],
    'model no.': ['MX162ZD'],
    'serial no.': ['FFMZP87VN1N0'],
    IMEI: ['356395106788056'],
    'local IPv4 address': ['10.0.0.68'],
    'local IPv6 address': [
        'fe80::c81:68e1:2199:631',
        'fd31:4159::cf9:d932:11c3:bede',
        'fd31:4159::5998:c752:9f96:5e30',
        'fd31:4159::30a2:88d6:66c9:125f',
        '2003:dd:af1c:ab00:cc6:9a3a:7bf5:90d7',
        '2003:dd:af1c:ab00:69d6:4c4d:cabc:5168',
        '2003:dd:af1c:ab00:c81:68e1:2199:631',
        'fd31:4159::c9a3:68ec:ea3f:f085',
        'fe80::8c75:69ff:fefc:273',
        'fe80::8c75:69ff:fefc:273',
        'fe80::f631:960f:130f:5dc1',
        'fe80::87bf:b362:c6d3:616f',
    ],
    'modem firmware': ['4.03.05'],
    SEID: ['044B24632'],
    IDFA: ['00000000-0000-0000-0000-000000000000', 'idfa'],
    'IDFV (keyword only)': ['idfv'],
    'device model': ['iPhone10,4'],
    'volume level': ['0.125'],
    'screen resolution': ['1334%750', '750%1334'],
    'uptime (keyword only)': ['uptime'],
    'disk space': ['127968497664', 'disk%11'],
};

(async () => {
    // Indicators
    const indicator_occurrences = {};
    const indicator_apps = {};
    for (const [name, strings] of Object.entries(indicators)) {
        const requests = await getRequestsForIndicator(db, strings);
        const app_count = [...new Set(requests.map((r) => r.name))].length;
        if (app_count > 1) {
            indicator_occurrences[name] = requests.length;
            indicator_apps[name] = app_count;
        }
    }
    fs.writeFileSync(path.join(out_dir, 'indicator_occurrences.json'), JSON.stringify(indicator_occurrences, null, 4));
    fs.writeFileSync(path.join(out_dir, 'indicator_apps.json'), JSON.stringify(indicator_apps, null, 4));

    // Requests per app
    const requests_per_app = (
        await db.many(
            'SELECT apps.name, COUNT(fr.id) as count FROM apps JOIN runs ON apps.name = runs.app LEFT JOIN filtered_requests fr ON runs.id = fr.run GROUP BY apps.name ORDER BY count ASC, name;'
        )
    ).reduce((acc, cur) => ({ ...acc, [cur.name]: parseInt(cur.count, 10) }), {});
    fs.writeFileSync(path.join(out_dir, 'requests_per_app.json'), JSON.stringify(requests_per_app, null, 4));

    // Hosts per app
    const hosts_per_app = (
        await db.many(
            'SELECT apps.name, COUNT(DISTINCT host) as count FROM apps join runs r on apps.name = r.app left join filtered_requests r2 on r.id = r2.run group by apps.name order by count, name;'
        )
    ).reduce((acc, cur) => ({ ...acc, [cur.name]: parseInt(cur.count, 10) }), {});
    fs.writeFileSync(path.join(out_dir, 'hosts_per_app.json'), JSON.stringify(hosts_per_app, null, 4));

    // Requests to third-party tracking servers
    // Tracker list taken from Exodus: https://reports.exodus-privacy.eu.org/en/trackers/
    // Changes:
    //   * separate subgroups for Google and Facebook merged manually
    //   * filters for Branch, KIDOZ, AdColony, Kochava added
    //   * subdomain requirement removed for some hosts (also allow apex domains)
    const trackers = require('./common/trackers.json');
    const tracker_counts = {};
    for (const [name, regex_str] of Object.entries(trackers)) {
        const res = await db.one(
            'SELECT COUNT(DISTINCT apps.name) as count from apps join runs on apps.name = runs.app join filtered_requests fr on runs.id = fr.run where host ~ ${regex};',
            { regex: `${regex_str}$` }
        );
        const app_count = parseInt(res.count, 10);
        if (app_count > 5) tracker_counts[name] = app_count;
    }
    fs.writeFileSync(path.join(out_dir, 'tracker_counts.json'), JSON.stringify(tracker_counts, null, 4));

    // Requests blocked by tracking filter lists
    const requests = await db.many(
        'SELECT name, fr.host as host, fr.path as path from apps join runs on apps.name = runs.app join filtered_requests fr on runs.id = fr.run;'
    );
    const list = getTrackingFilterlist();

    const filtered_requests = requests.filter((r) => !list.includes(r.host));
    console.log(`Total requests: ${requests.length}, requests after filtering: ${filtered_requests.length}`);

    const apps = [...new Set(requests.map((r) => r.name))];
    const top_list = require('../iphone-top-1200-2021-05-27.json')
        .map((p) => p.contentData)
        .flat();
    const filter_stats = apps
        .map((name) => {
            const total_requests = requests.filter((r) => r.name === name).length;
            const requests_after_filtering = filtered_requests.filter((r) => r.name === name).length;
            const top_list_entry = top_list.find((e) => e.buyData['bundle-id'] === name);
            if (!top_list_entry) {
                console.log(name);
                console.log(top_list_entry?.name.split('.')[0]);
            }
            return {
                name,
                total_requests,
                requests_after_filtering,
                blocked_requests: total_requests - requests_after_filtering,
                blocked_ratio: (total_requests - requests_after_filtering) / total_requests,
                top_list_position: top_list_entry?.name.split('.')[0],
            };
        })
        .sort((a, b) => b.blocked_ratio - a.blocked_ratio);
    fs.writeFileSync(path.join(out_dir, 'filter_stats.json'), JSON.stringify(filter_stats, null, 4));

    // Privacy labels
    const privacy_label_indicator_data = require('../data/privacy_label_categories.json');
    const pl_indicators = Object.values(privacy_label_indicator_data).reduce(
        (acc, cur) => {
            for (const cat of cur) {
                const ok = cat.ok ? 'ok' : 'nok';
                const nok = cat.ok ? 'nok' : 'ok';
                if (acc[ok][cat.data_category]) acc[ok][cat.data_category]++;
                else {
                    acc[ok][cat.data_category] = 1;
                    if (!acc[nok][cat.data_category]) acc[nok][cat.data_category] = 0;
                }
            }
            return acc;
        },
        { ok: {}, nok: {} }
    );
    fs.writeFileSync(
        path.join(out_dir, 'privacy_label_categories_for_graph.json'),
        JSON.stringify(pl_indicators, null, 4)
    );

    const privacy_label_purpose_data = require('../data/privacy_label_purposes.json');
    const pl_purposes = Object.values(privacy_label_purpose_data).reduce(
        (acc, cur) => {
            for (const type of ['tracking', 'ads']) {
                const ok = cur[`${type}_ok`] ? 'ok' : 'nok';
                if (cur[`${type}_used`]) {
                    acc[ok][type]++;
                }
            }
            return acc;
        },
        { ok: { tracking: 0, ads: 0 }, nok: { tracking: 0, ads: 0 } }
    );
    fs.writeFileSync(
        path.join(out_dir, 'privacy_label_purposes_for_graph.json'),
        JSON.stringify(
            {
                ok: [
                    ['tracking', 'ads'],
                    [pl_purposes.ok.tracking, pl_purposes.ok.ads],
                ],
                nok: [
                    ['tracking', 'ads'],
                    [pl_purposes.nok.tracking, pl_purposes.nok.ads],
                ],
            },
            null,
            4
        )
    );
})();
