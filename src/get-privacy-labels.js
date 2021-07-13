const path = require('path');
const fs = require('fs-extra');
const glob = require('glob');
const StreamZip = require('node-stream-zip');
const plist = require('plist');
const fetch = require('node-fetch');

// From what I can tell, the token used below seems to be the same for everyone. It can be eastily obtained as follows:
// Go to any app (like https://apps.apple.com/us/app/facebook/id284882215), and observe the network traffic while
// clicking the 'See Details' link next to 'App Privacy'.
// Note that the API endpoint we use is ratelimited but with a little delay this is no problem.

const out_dir = path.join(__dirname, '..', 'data', 'privacy-labels');
const apps_dir = '/media/benni/storage2/tmp/3u';
const api_url = (item_id) =>
    `https://amp-api.apps.apple.com/v1/catalog/US/apps/${item_id}?platform=web&fields=privacyDetails&l=en-us`;

const getItemMeta = async (ipa) => {
    const zip = new StreamZip.async({ file: ipa });
    const meta_plist = await zip.entryData('iTunesMetadata.plist');
    const meta = plist.parse(meta_plist.toString());
    await zip.close();
    return { item_id: meta['itemId'], bundle_id: meta['softwareVersionBundleId'] };
};
const pause = (ms) => new Promise((res) => setTimeout(res, ms));

(async () => {
    fs.ensureDirSync(out_dir);
    const ipas = glob.sync(`${apps_dir}/*.ipa`, { absolute: true });
    for (const ipa of ipas) {
        const { item_id, bundle_id } = await getItemMeta(ipa).catch((err) => {
            console.error('Getting item ID failed for:', ipa);
            return { item_id: undefined, bundle_id: undefined };
        });
        if (!item_id || !bundle_id) continue;

        const out_path = path.join(out_dir, `${bundle_id}.json`);
        if (fs.existsSync(out_path)) continue;

        const res = await fetch(api_url(item_id), {
            credentials: 'include',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; rv:91.0) Gecko/20100101 Firefox/91.0',
                Accept: 'application/json',
                'Accept-Language': 'en-US,en;q=0.7,de;q=0.3',
                Authorization:
                    'Bearer eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlU4UlRZVjVaRFMifQ.eyJpc3MiOiI3TktaMlZQNDhaIiwiaWF0IjoxNjI1NTkzNDM5LCJleHAiOjE2MzI4NTEwMzl9.gZLHd3Kk2nNznLJgj7zUH_R0fthv1XYu8MeyIwUlL7tEoXP46BY33mO7bmxuJ3EhAYBGQ5wMqj8u-vBTiIlh7Q',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-site',
                'Sec-GPC': '1',
                Pragma: 'no-cache',
                'Cache-Control': 'no-cache',
            },
            referrer: 'https://apps.apple.com/',
            method: 'GET',
            mode: 'cors',
        });
        if (!res.ok && res.status !== 404) {
            if (res.status === 429) {
                console.error('Hit ratelimit:', await res.text());
                console.log(res);
                process.exit(1);
            } else {
                console.error(`Hit unexpected status code (${res.status}):`, await res.text());
                console.log(res);
            }
        } else {
            fs.writeFileSync(out_path, await res.text());
            console.log('Successfully fetched privacy labels for:', bundle_id);
        }
        await pause(1000 + Math.random() * 500);
    }
})();
