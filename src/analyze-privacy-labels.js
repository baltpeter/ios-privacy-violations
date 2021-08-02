const path = require('path');
const fs = require('fs');
const glob = require('glob');
const { db } = require('./common/db');
const { getRequestsForIndicator, getTrackingFilterlist, privacy_label_indicators } = require('./common/query');

const data_dir = path.join(__dirname, '..', 'data', 'privacy-labels');
const out_dir = path.join(__dirname, '..', 'data');

const ads_regex =
    /.doubleclick.net$|api.vungle.com$|.adcolony.com$|.supersonicads.com$|.inner-active.mobi$|unityads.unity3d.com$|ads.mopub.com$|.fyber.com$/;
const list = getTrackingFilterlist();

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
    const purpose_instances = {};
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

        for (const [name, strings] of Object.entries(privacy_label_indicators)) {
            const requests = await getRequestsForIndicator(db, strings, app.bundleId);
            if (requests.length > 0) {
                if (!category_instances[app.bundleId]) category_instances[app.bundleId] = [];
                const ok =
                    name === 'Coarse Location'
                        ? dataCategories.includes(name) || dataCategories.includes('Precise Location')
                        : dataCategories.includes(name);
                category_instances[app.bundleId].push({
                    data_category: name,
                    requests: requests.map((r) => r.id),
                    ok,
                });
                if (!ok)
                    console.log(
                        app.bundleId,
                        name,
                        requests.map((r) => r.id)
                    );
            }
        }

        const requests = await db.manyOrNone(
            'SELECT fr.host as host from apps join runs on apps.name = runs.app join filtered_requests fr on runs.id = fr.run where apps.name = ${bundle_id};',
            { bundle_id: app.bundleId }
        );
        const tracking_used = requests.filter((r) => !list.includes(r.host)).length > 0;
        const tracking_ok = purposes.includes('Analytics');
        const ads_used = requests.some((r) => ads_regex.test(r.host));
        const ads_ok = purposes.includes('Third-Party Advertising');
        purpose_instances[app.bundleId] = { tracking_used, tracking_ok, ads_used, ads_ok };
        if ((tracking_used && !tracking_ok) || (ads_used && !ads_ok)) {
            console.log(app.bundleId, tracking_used, tracking_ok, ads_used, ads_ok);
        }
    }

    fs.writeFileSync(path.join(out_dir, 'privacy_label_categories.json'), JSON.stringify(category_instances, null, 4));
    fs.writeFileSync(path.join(out_dir, 'privacy_label_purposes.json'), JSON.stringify(purpose_instances, null, 4));
})();
