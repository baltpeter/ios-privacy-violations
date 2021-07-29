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
    'device name': ['frGl5OLv20'],
    // 'OS version': ['14.5.1'],
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
    const filter_stats = apps
        .map((name) => {
            const total_requests = requests.filter((r) => r.name === name).length;
            const requests_after_filtering = filtered_requests.filter((r) => r.name === name).length;
            return {
                name,
                total_requests,
                requests_after_filtering,
                blocked_requests: total_requests - requests_after_filtering,
                blocked_ratio: (total_requests - requests_after_filtering) / total_requests,
            };
        })
        .sort((a, b) => b.blocked_ratio - a.blocked_ratio);
    fs.writeFileSync(path.join(out_dir, 'filter_stats.json'), JSON.stringify(filter_stats, null, 4));
})();
