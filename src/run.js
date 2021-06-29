const path = require('path');
const yesno = require('yesno');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const glob = require('glob');
const chalk = require('chalk');
const execa = require('execa');
const frida = require('frida');
const { db } = require('./common/db');
const ipaInfo = require('./common/ipa-info');
const { pause } = require('./common/util');

const app_timeout = 60;
const idevice_ip = '10.0.0.83';
const apps_dir = '/media/benni/storage2/tmp/3u';
const mitmdump_path = path.join(__dirname, '../venv/bin/mitmdump');
const mitmdump_addon_path = path.join(__dirname, 'mitm-addon.py');

// prettier-ignore
const permissions_to_grant = ['kTCCServiceLiverpool', 'kTCCServiceUbiquity', 'kTCCServiceCalendar', 'kTCCServiceAddressBook', 'kTCCServiceReminders', 'kTCCServicePhotos', 'kTCCServiceMediaLibrary', 'kTCCServiceBluetoothAlways', 'kTCCServiceMotion', 'kTCCServiceWillow', 'kTCCServiceExposureNotification'];
const permissions_to_deny = ['kTCCServiceCamera', 'kTCCServiceMicrophone', 'kTCCServiceUserTracking'];

// value === 0 for not granted, value === 2 for granted
async function setPermission(permission, bundle_id, value) {
    const timestamp = Math.floor(Date.now() / 1000);
    await execa('sshpass', [
        '-p',
        'alpine',
        'ssh',
        `root@${idevice_ip}`,
        'sqlite3',
        '/private/var/mobile/Library/TCC/TCC.db',
        `'INSERT OR REPLACE INTO access VALUES("${permission}", "${bundle_id}", 0, ${value}, 2, 1, NULL, NULL, 0, "UNUSED", NULL, 0, ${timestamp});'`,
    ]);
}

const grantLocationPermission = async (bundle_id) => {
    try {
        await execa('sshpass', ['-p', 'alpine', 'ssh', `root@${idevice_ip}`, 'open com.apple.Preferences']);
        const session = await frida.getUsbDevice().then((f) => f.attach('Settings'));
        const script = await session.createScript(
            `ObjC.classes.CLLocationManager.setAuthorizationStatusByType_forBundleIdentifier_(4, "${bundle_id}");`
        );
        await script.load();
        await session.detach();
    } catch (err) {
        console.log('Could not grant location permission:', err);
    }
};

const seedClipboard = async (string) => {
    try {
        const session = await frida.getUsbDevice().then((f) => f.attach('SpringBoard'));
        const script = await session.createScript(
            `ObjC.classes.UIPasteboard.generalPasteboard().setString_("${string}");`
        );
        await script.load();
        await session.detach();
    } catch (err) {
        console.log('Could seed clipboard:', err);
    }
};

async function main() {
    const ok = await yesno({
        question: 'Have you disabled PiHole?',
    });
    if (!ok) process.exit(1);
    const ipa_paths = glob.sync(`${apps_dir}/*.ipa`, { absolute: true });

    for (const ipa_path of ipa_paths) {
        const [{ CFBundleIdentifier: id, CFBundleShortVersionString: version }] = await ipaInfo(ipa_path);

        const done = !!(await db.any('SELECT 1 FROM apps WHERE name = ${id} AND version = ${version}', { id, version }))
            .length;
        if (done) {
            console.log(chalk.underline(`Skipping ${id}@${version}…`));
            console.log();
            continue;
        }
        console.log(chalk.underline(`Analyzing ${id}@${version}…`));

        console.log('Inserting into DB…');
        await db.none('INSERT INTO apps (name, version) VALUES(${id}, ${version}) ON CONFLICT DO NOTHING', {
            id,
            version,
        });

        let mitmdump;
        const cleanup = async () => {
            console.log('Cleaning up mitmproxy instance…');
            mitmdump.kill();
            await mitmdump.catch(() => {});

            console.log('Uninstalling app…');
            await execa('ideviceinstaller', ['--uninstall', id]);
            // Clear switcher and press home button to get rid of any potential stuck permission prompts etc.
            await execa('sshpass', [
                '-p',
                'alpine',
                'ssh',
                `root@${idevice_ip}`,
                `activator send libactivator.system.clear-switcher; activator send libactivator.system.homebutton`,
            ]);
        };
        try {
            console.log('Starting proxy…');
            mitmdump = execa(mitmdump_path, ['-s', mitmdump_addon_path, '--set', `appname=${id}`]);

            console.log('Installing app…');
            await execa('ideviceinstaller', ['--install', ipa_path]);

            console.log('Granting permissions…');
            for (const permission of permissions_to_grant) await setPermission(permission, id, 2);
            for (const permission of permissions_to_deny) await setPermission(permission, id, 0);
            await grantLocationPermission(id);
            await execa('sshpass', [
                '-p',
                'alpine',
                'ssh',
                `root@${idevice_ip}`,
                `activator send libactivator.system.homebutton`,
            ]);

            console.log('Seeding clipboard…');
            await seedClipboard('LDDsvPqQdT');

            console.log(`Starting app for ${app_timeout} seconds…`);
            await execa('sshpass', ['-p', 'alpine', 'ssh', `root@${idevice_ip}`, `open ${id}`]);
            await pause(app_timeout * 1000);

            await cleanup();
        } catch (err) {
            console.log('Error:', err);

            await cleanup();
            await db.none('DELETE FROM apps WHERE name = ${id} AND version = ${version}', { id, version });

            console.log();
        }

        console.log();
    }
}

main();
