# Notes

## Presentation

* Video of buying apps in 3u
* Video of scrolling through App Store purchases
* Screenshot of Facebook app or whatever with funny permissions

## iOS emulation

### Appetize.io

https://appetize.io/demo

* includes network intercept
* pricing info: https://appetize.io/pricing
* cannot use IPAs, needs iOS simulator build: https://docs.appetize.io/core-features/uploading-apps

### Run that app

https://www.runthatapp.com/

* uses iOS simulator
* cannot use IPAs: http://upload.runthatapp.com/upload.html

### Corellium

https://corellium.com/security-research

* uses custom ARM hypervisor: https://corellium.com/platform
* supports Frida: https://headwayapp.co/corellium-release-notes (2.6.3) -> only for Android?: https://support.corellium.com/hc/en-us/articles/360057556953-Frida-Console
* includes network monitor (apparently automatically bypasses cert pinning, unclear whether traffic can be downloaded for analysis): https://corellium.com/blog/network-monitor-demo
    * doesn't seem possible to download traffic
    * but accessible via API: https://corellium.github.io/corellium-api/NetworkMonitor.html
* unclear whether App Store apps can be installed
    * "Corellium does not support logging into an iCloud account or downloading apps from the App Store.": https://support.corellium.com/hc/en-us/articles/360053569554-Introduction-to-iOS-Devices
    * IPAs can be installed, "On iOS, loading an app requires that the app be properly signed. You must load an app just as you would load it on a physical device. This is required both for jailbroken and non-jailbroken devices. If you receive an error when uploading an app, please ensure your app is appropriately signed and that you can load it on a physical device.": https://support.corellium.com/hc/en-us/articles/360051662354-Apps
* automation is possible via API: https://github.com/corellium/corellium-api
    * https://corellium.github.io/corellium-api/Input.html
    * taking and restoring snapshots possible via API
    * https://corellium.github.io/corellium-api/Agent.html#installFile
    * https://corellium.github.io/corellium-api/Agent.html#kill
    * https://corellium.github.io/corellium-api/Agent.html#run
* trial requested (required address and CC)

## Obtaining iOS apps

### Ideas

* IPA files are compiled for ARM and can only be run on physical devices? https://docs.appetize.io/core-features/uploading-apps
* Installing unsigned IPAs is possible through AppSync Unified (from Cydia): https://cydia.akemi.ai/?page/net.angelxwind.appsyncunified
* Third-party software that claims to be able to download IPAs: https://imazing.com/guides/how-to-manage-apps-without-itunes
* Downloading IPAs also seems to be possible through Apple Configurator: https://apple.stackexchange.com/a/298455
* Was also possible with iTunes 12.6.5. Can this version still be downloaded/used?: https://apple.stackexchange.com/a/301720
* https://github.com/dpnishant/appmon/wiki/8.-Usage-Guide:-AppMon-IPA-Installer

* Directly calling the APIs probably not feasible due to `kbsync` parameter.
    - https://s3.amazonaws.com/s3.synack.com/T2_reversingIOSApps.pdf
    - https://bbs.pediy.com/thread-156752.htm
    - https://bbs.pediy.com/thread-183220.htm
    - https://bbs.pediy.com/thread-163461.htm
    - https://bbs.pediy.com/thread-157163.htm
    - https://www.zhihu.com/column/p/29278195
    - http://www.ymsky.net/views/64756.shtml
    - https://blog.csdn.net/qq_22071935/article/details/48056213
    - https://habr.com/ru/post/149207/

### Results

* From watching the buy flow network traffic from the actual device, it _seems_ relatively straighforward. Buying apps (and auth for that) happens via `https://p{itspod}-buy.itunes.apple.com`.  Needs `kbsync` parameter (base64 of something complicated, see above). If obtained once, `kbsync` can apparently be used multiple times (unclear how long).
    - 3u and iMazing can correctly generate `kbsync`. I have even been able to trace this to the exact DLL call in `C:\Program Files (x86)\3uTools\itunesDll\lbm.dll` but I lack the necessary Windows reversing knowledge to be able to actually use this info and find out parameters, how to call function, etc.
    - There are also some other necessary cookies (and maybe headers) that I haven't quite figured out but that doesn't seem too hard.
    - Nonetheless, I have for some reason not been able to actually issue either the auth or buy request. Replaying them using mitmproxy works just fine (even when changing parameters) but when I issue the request through Insomnia or from Node, it fails. No idea why.
* By default, apps purchased on any device (including on macOS and through third-party tools) are auto-downloaded to the iPhone. Can be disabled via Settings -> App Store -> Automatic Downloads -> Apps.
* iMazing and Apple Configurator 2 can only download apps that have already been 'purchased' by the Apple ID.
* iTunes 12.6.5.3 can't be used with newer iPhones/iOS versions anymore. People [claim](https://www.reddit.com/r/ITunes/comments/g01qqh/itunes_12653_working_with_ios_13/) that there are workaround but I haven't gotten that to work.
* M1 macs can also [install some iOS apps](https://www.macrumors.com/2021/01/15/m1-macs-sideloading-ios-apps-no-longer-possible/) if allowed by the developer. Selection, especially of interesting (top) apps is fairly limited. When bought through macOS, apps are also considered 'bought' on iOS. Without having actually investigated this further, it seems like the actual iOS app is downloaded into `/Applications` but unpacked into as `.app` instead of `.ipa`. It _might_ be possible to repackage and install those on iOS. Not tested. 
* 3u (and presumably also iMazing) don't just download the `pre-thinned<something>.lc.<something>.<something>.signed.dpkg.ipa` file (which, despite the name, isn't actually signed?!) but later append the actual signature to that. Only after that can the app be installed on the non-jailbroken device.
* 3u for some reason doesn't use the actual iTunes search and top lists but only offers their own custom list of (mostly weird) apps. However, as the actual buying and downloading is done through the actual iOS/iTunes endpoint, it is possible to download any app if one manipulates the app ID.

* In conclusion, it seems like 3u is currently the only way (apart from _maybe_ the macOS app store) to download iOS that haven't previously been bought by the user's Apple ID. It has the added benefit that the downloaded apps are correctly signed and can be installed even without a jailbreak.
* Thus, while ridiculous and unsatisfactory, this is the approach that I have used to successfully download a sufficient amount (1,000) of apps:
    - A mitmproxy addon is used to intercept the requests to 3u's app list endpoint (`http://app.pcres.3u.com/app_list.action`) and rewrite them to instead return the actual top apps from 2021-05-27.
    - The app downloads are then manually initiated through the 3u UI.
    - A couple of apps have gotten into a weird state where Apple thinks that the Apple ID owns a previous version of the app and is entitled to a free upgrade (great…). Neither 3u nor iMazing can deal with that.
    - I got until "974. Girl Genius!", after that I prioritized small apps to get as many as possible into the 120 GB.

## Potentially interesting links

* [ ] https://spaceraccoon.dev/from-checkra1n-to-frida-ios-app-pentesting-quickstart-on-ios-13
* [ ] Starting apps using Frida: https://github.com/AloneMonkey/frida-ios-dump/blob/56e99b2138fc213fa759b3aeb9717a1fb4ec6a59/dump.py#L253
* [ ] http://cydia.saurik.com/package/com.ethanrdoesmc.truecuts/
* [ ] https://autotouch.net/
* [x] ~~https://github.com/ios-control/ios-deploy~~
* [ ] https://steipete.com/posts/jailbreaking-for-ios-developers/
* [ ] https://www.supercharge.app/
* [x] https://github.com/nabla-c0d3/ssl-kill-switch2
* [x] ~~https://github.com/dpnishant/appmon/wiki/4.c.i-Creating-a-iOS-Developer-Profile~~
* [x] ~~http://www.cydiaimpactor.com/~~
* [x] ~~https://github.com/DanTheMan827/ios-app-signer~~
* [x] ~~https://cokepokes.github.io/depiction/appstoreplus.html~~
* [ ] https://mobile-security.gitbook.io/mobile-security-testing-guide/ios-testing-guide/0x06b-basic-security-testing
* [ ] https://www.npmjs.com/package/itms-services (for downloading OTA? apps)
* [ ] https://github.com/chaitin/passionfruit
* [x] https://libimobiledevice.org/
* [ ] https://cydia.akemi.ai/?page/com.linusyang.appinst
* [ ] https://github.com/IntergalacticPenguin/mobile-toolkit

## Device

* iPhone 8
* A11
* SN: FFMZP87VN1N0
* IMEI: 356395106788056
* Storefront: 143443-2,29

## libimobiledevice

To use the interesting commands, first:

1. Get the iOS version from `ideviceinfo -k ProductVersion` (e.g. `14.5.1`).
2. Download the matching `DeveloperDiskImage.dmg` and `DeveloperDiskImage.dmg.signature` from <https://github.com/pdso/DeveloperDiskImage>.
3. Run `ideviceimagemounter DeveloperDiskImage.dmg`.

Then you can:

* Start apps: `idevicedebug run <bundle_id>`, e.g. `idevicedebug run org.mozilla.ios.Firefox` (doesn't really work?)
* Create a screenshot: `idevicescreenshot`

## App Store APIs

* Get privacy labels for an app: `curl 'https://amp-api.apps.apple.com/v1/catalog/US/apps/835599320?platform=web&fields=privacyDetails&l=en-us' -H 'Origin: https://apps.apple.com'`
* https://www.npmjs.com/package/app-store-scraper
* https://github.com/ashbaldry/appler
* https://affiliate.itunes.apple.com/resources/documentation/itunes-store-web-service-search-api/
* top lists
    - "RSS feeds" (https://rss.itunes.apple.com/en-us), also try `non-explicit.json`
        * https://rss.itunes.apple.com/api/v1/de/ios-apps/top-free/all/200/explicit.json
        * https://rss.itunes.apple.com/api/v1/de/ios-apps/top-free/games/200/explicit.json
        * https://rss.itunes.apple.com/api/v1/de/ios-apps/new-apps-we-love/all/200/explicit.json
        * https://rss.itunes.apple.com/api/v1/de/ios-apps/new-games-we-love/all/200/explicit.json
        * https://rss.itunes.apple.com/api/v1/de/ios-apps/top-free-ipad/all/200/explicit.json
    - older version of the feeds, allows specifying the genre
        * https://itunes.apple.com/de/rss/topfreeapplications/limit=200/genre=6001/json
    - top 1200 courtesy of old app store API
        * http://itunes.apple.com/WebObjects/MZStore.woa/wa/topChartFragmentData?cc=de&genreId=36&pageSize=120&popId=27&pageNumbers=0,1,2,3,4,5,6,7,8,9
        * Header: `X-Apple-Store-Front: 143443,9`
        * references
            - https://stackoverflow.com/a/30134648
            - https://fann.im/blog/2018/05/15/app-store-front-code/
            - https://stackoverflow.com/a/58776183
            - https://42matters.com/docs/app-market-data/ios/apps/appstore-genres
            - https://gist.github.com/sgmurphy/1878352#gistcomment-2977743

## mitmproxy

* Setup surprisingly easy: https://www.andyibanez.com/posts/intercepting-network-mitmproxy/#physical-ios-devices
* https://github.com/nabla-c0d3/ssl-kill-switch2 (https://steipete.com/posts/jailbreaking-for-ios-developers/#ssl-kill-switch)
    - Install Debian Packager, Cydia Substrate, PreferenceLoader and Filza from Cydia.
    - Download latest release: https://github.com/nabla-c0d3/ssl-kill-switch2/releases
    - In Filza, go to `/private/var/mobile/Library/Mobile Documents/com~apple~CloudDocs/Downloads` and install.
    - Respring.
    - Enable in Settings under SSL Kill Switch 2.

## Device preparation

* Jailbreak
* mitmproxy section
* Enable SSH server 
    - Install packages OpenSSH, Open, Sqlite3 from Cydia
    - Connect using `root@<ip>`, password `alpine`
* Settings
    - Display & Brightness -> Auto-Lock -> Never
* Install [Activator](https://cydia.saurik.com/package/libactivator/)

## Automation

### From macOS

* Install app: `cfgutil install-app <file>.ipa`
* Uninstall app: `cfgutil remove-app <bundle-id>`

### From Linux

* Install app: `ideviceinstaller --install <file>.ipa`
* Start app: `sshpass -p alpine ssh root@10.0.0.83 "open <bundle-id>"` (requires `apt install sshpass`)
* Uninstall app: `ideviceinstaller --uninstall <bundle-id>`
* List installed apps: `ideviceinstaller -l`
* Activator commands: `sshpass -p alpine ssh root@10.0.0.83 "<command>"`
    - Press home button: `activator send libactivator.system.homebutton`
    - Press power button: `activator send libactivator.system.sleepbutton`
    - Open app: `activator send <bundle-id>`

## Background noise

* Background traffic (without any interactions other than turning screen off and on) captured between 2021-05-29T12:41:56 and 2021-05-31T23:27:48.
* Stored in `flows/bg-noise-flows`.
* Can be imported using `mitmdump -s mitm_addon.py --set appname=background-noise -r flows/bg-noise-flows` (first create app `background-noise` in DB).
* Apple has a very helpful support pages that explains (most) background connections: https://support.apple.com/en-us/HT210060
    - ```js
      $$('tr').filter(e => e.children[3].textContent.includes('iOS')).map(e => e.children).map(c => ([c[0].textContent, c[4].textContent])).map(i => `requests.host ${i[0].includes('*') ? '~~' : '='} '${i[0].replace(/\*/g, '%')}' -- "${i[1]}" (${window.location})`).join('\nAND NOT ')
      ```

### Filter view

```sql
CREATE VIEW filtered_requests AS
SELECT * FROM requests WHERE NOT requests.host = 'albert.apple.com' -- "Device activation" (https://support.apple.com/en-us/HT210060)
AND NOT requests.host = 'captive.apple.com' -- "Internet connectivity validation for networks that use captive portals" (https://support.apple.com/en-us/HT210060)
AND NOT requests.host = 'gs.apple.com' -- (https://support.apple.com/en-us/HT210060)
AND NOT requests.host = 'humb.apple.com' -- (https://support.apple.com/en-us/HT210060)
AND NOT requests.host = 'static.ips.apple.com' -- (https://support.apple.com/en-us/HT210060)
AND NOT requests.host = 'sq-device.apple.com' -- "eSIM activation" (https://support.apple.com/en-us/HT210060)
AND NOT requests.host = 'tbsc.apple.com' -- (https://support.apple.com/en-us/HT210060)
AND NOT requests.host = 'time-ios.apple.com' -- "Used by devices to set their date and time" (https://support.apple.com/en-us/HT210060)
AND NOT requests.host = 'time.apple.com' -- "Used by devices to set their date and time" (https://support.apple.com/en-us/HT210060)
AND NOT requests.host ~~ '%.push.apple.com' -- "Push notifications" (https://support.apple.com/en-us/HT210060)
AND NOT requests.host = 'gdmf.apple.com' -- "Used by an MDM server to identify which software updates are available to devices that use managed software updates" (https://support.apple.com/en-us/HT210060)
AND NOT requests.host = 'deviceenrollment.apple.com' -- "DEP provisional enrollment" (https://support.apple.com/en-us/HT210060)
AND NOT requests.host = 'deviceservices-external.apple.com' -- (https://support.apple.com/en-us/HT210060)
AND NOT requests.host = 'identity.apple.com' -- "APNs certificate request portal" (https://support.apple.com/en-us/HT210060)
AND NOT requests.host = 'iprofiles.apple.com' -- "Hosts enrollment profiles used when devices enroll in Apple School Manager or Apple Business Manager through Device Enrollment" (https://support.apple.com/en-us/HT210060)
AND NOT requests.host = 'mdmenrollment.apple.com' -- "MDM servers to upload enrollment profiles used by clients enrolling through Device Enrollment in Apple School Manager or Apple Business Manager, and to look up devices and accounts" (https://support.apple.com/en-us/HT210060)
AND NOT requests.host = 'setup.icloud.com' -- "Required to log in with a Managed Apple ID on Shared iPad" (https://support.apple.com/en-us/HT210060)
AND NOT requests.host = 'vpp.itunes.apple.com' -- "MDM servers to perform operations related to Apps and Books, like assigning or revoking licenses on a device" (https://support.apple.com/en-us/HT210060)
AND NOT requests.host = 'appldnld.apple.com' -- "iOS updates" (https://support.apple.com/en-us/HT210060)
AND NOT requests.host = 'gg.apple.com' -- "iOS, tvOS, and macOS updates" (https://support.apple.com/en-us/HT210060)
AND NOT requests.host = 'mesu.apple.com' -- "Hosts software update catalogs" (https://support.apple.com/en-us/HT210060)
AND NOT requests.host = 'ns.itunes.apple.com' -- (https://support.apple.com/en-us/HT210060)
AND NOT requests.host = 'updates-http.cdn-apple.com' -- (https://support.apple.com/en-us/HT210060)
AND NOT requests.host = 'updates.cdn-apple.com' -- (https://support.apple.com/en-us/HT210060)
AND NOT requests.host = 'xp.apple.com' -- (https://support.apple.com/en-us/HT210060)
AND NOT requests.host ~~ '%.itunes.apple.com' -- "Store content such as apps, books, and music" (https://support.apple.com/en-us/HT210060)
AND NOT requests.host ~~ '%.apps.apple.com' -- "Store content such as apps, books, and music" (https://support.apple.com/en-us/HT210060)
AND NOT requests.host ~~ '%.mzstatic.com' -- "Store content such as apps, books, and music" (https://support.apple.com/en-us/HT210060)
AND NOT requests.host = 'itunes.apple.com' -- (https://support.apple.com/en-us/HT210060)
AND NOT requests.host = 'ppq.apple.com' -- "Enterprise App validation" (https://support.apple.com/en-us/HT210060)
AND NOT requests.host = 'serverstatus.apple.com' -- "Content caching client public IP determination" (https://support.apple.com/en-us/HT210060)
AND NOT requests.host ~~ '%.appattest.apple.com' -- "App validation, Touch ID and Face ID authentication for websites" (https://support.apple.com/en-us/HT210060)
AND NOT requests.host = 'fba.apple.com' -- "Used by Feedback Assistant to file and view feedback" (https://support.apple.com/en-us/HT210060)
AND NOT requests.host = 'cssubmissions.apple.com' -- "Used by Feedback Assistant to upload files" (https://support.apple.com/en-us/HT210060)
AND NOT requests.host = 'diagassets.apple.com' -- "Used by Apple devices to help detect possible hardware issues" (https://support.apple.com/en-us/HT210060)
AND NOT requests.host = 'doh.dns.apple.com' -- "Used for DNS over HTTPS (DoH)" (https://support.apple.com/en-us/HT210060)
AND NOT requests.host = 'crl.apple.com' -- "Certificate validation" (https://support.apple.com/en-us/HT210060)
AND NOT requests.host = 'crl.entrust.net' -- "Certificate validation" (https://support.apple.com/en-us/HT210060)
AND NOT requests.host = 'crl3.digicert.com' -- "Certificate validation" (https://support.apple.com/en-us/HT210060)
AND NOT requests.host = 'crl4.digicert.com' -- "Certificate validation" (https://support.apple.com/en-us/HT210060)
AND NOT requests.host = 'ocsp.apple.com' -- "Certificate validation" (https://support.apple.com/en-us/HT210060)
AND NOT requests.host = 'ocsp.digicert.com' -- "Certificate validation" (https://support.apple.com/en-us/HT210060)
AND NOT requests.host = 'ocsp.entrust.net' -- "Certificate validation" (https://support.apple.com/en-us/HT210060)
AND NOT requests.host = 'ocsp.verisign.net' -- "Certificate validation" (https://support.apple.com/en-us/HT210060)
AND NOT requests.host = 'valid.apple.com' -- "Certificate validation" (https://support.apple.com/en-us/HT210060)

AND NOT requests.host = 'ocsp2.apple.com' -- OCSP
AND NOT requests.host ~~ '%smoot.apple.com' -- Spotlight (https://apple.stackexchange.com/a/157495)
AND NOT requests.host = 'configuration.apple.com' -- CloudKit/iCloud (https://en.wikipedia.org/wiki/CloudKit)
AND NOT requests.host = 'configuration.ls.apple.com'
AND NOT requests.host ~~ 'gspe%-ssl.ls.apple.com' -- Apple Maps (https://developer.apple.com/forums/thread/99015)
AND NOT requests.host ~~ 'gsp%-ssl.ls.apple.com' -- Apple Maps (https://developer.apple.com/forums/thread/99015)
AND NOT requests.host = 'weather-data.apple.com' -- Weather data
AND NOT requests.host = 'pancake.apple.com'
AND NOT requests.host = 'token.safebrowsing.apple' -- Safe browsing
AND NOT requests.host = 'apple-finance.query.yahoo.com' -- Finance widget
AND NOT requests.host ~~ 'p%-%.icloud.com' -- iCloud calendar, contacts
AND NOT requests.host = 'keyvalueservice.icloud.com' -- iCloud keychain (https://speakerdeck.com/belenko/icloud-keychain-and-ios-7-data-protection, https://github.com/prabhu/iCloud)
AND NOT requests.host = 'gs-loc.apple.com' -- Location services (https://apple.stackexchange.com/questions/63540/what-is-gs-loc-apple-com, https://github.com/zadewg/GS-LOC)
```

## Granting permissions

* Permissions stored in `/private/var/mobile/Library/TCC/TCC.db`, table `access`.
    - `auth_value == 0` means permission not granted, `auth_value == 2` means permission granted.
    - `INSERT OR REPLACE INTO access VALUES("kTCCServiceCalendar", "com.podfactor.pod", 0, 2, 2, 1, NULL, NULL, 0, "UNUSED", NULL, 0, 1623176245);`
    - `INSERT OR REPLACE INTO access (service, client, client_type, auth_value, auth_reason, auth_version, indirect_object_identifier_type, indirect_object_identifier, flags, last_modified) VALUES ("kTCCServiceMicrophone", "com.podfactor.pod", 0, 2, 2, 1, 0, "UNUSED", 0, 1623176245);`
    - Following permissions are available (see: `/System/Library/PrivateFrameworks/TCC.framework/en.lproj/Localizable.strings`):
        * [x] `kTCCServiceLiverpool` (no visible effect, people claim it's related to location access)
        * [x] `kTCCServiceUbiquity` (no visible effect, people claim it's related to iCloud)
        * [ ] `kTCCServiceWebKitIntelligentTrackingPrevention` ("Allow Cross-Website Tracking", 0 means yes, 2 no)

        * [ ] `kTCCServiceSensorKitBedSensingWriting` (no visible effect, "Add Data for Research Purposes", "record bed sensing Sensor & Usage data")
        * [ ] `kTCCServiceGameCenterFriends` (no visible effect, "connect you with your Game Center friends")
        * [x] `kTCCServiceExposureNotification` ("Exposure Notifications", "Your iPhone can securely collect and share random IDs with nearby devices. The app can use these IDs to notify you if you may have been exposed to COVID-19. The date, duration, and signal strength of an exposure will be shared", "COVID-19 Exposure Logging and Notifications")
        * [ ] `kTCCServicePrototype4Rights` (no visible effect, "Authorization to Test Service Proto4Right")
        * [0] `kTCCServiceUserTracking` ("Allow Tracking", "track your activity across other companies’ apps and websites")
        * [x] `kTCCServiceCalendar` ("Calendars", "Access Your Calendar")
        * [x] `kTCCServiceAddressBook` ("Contacts", "Access Your Contacts")
        * [x] `kTCCServiceReminders` ("Reminders", "Access Your Reminders")
        * [x] `kTCCServicePhotos` ("Photos (All Photos)", "Access your photos")
        * [ ] `kTCCServicePhotosAdd` ("Photos (Add Photos Only)", "Add to your Photos")
        * [x] `kTCCServiceMediaLibrary` ("Media & Apple Music", "access Apple Music, your music and video activity, and your media library")
        * [x] `kTCCServiceBluetoothAlways` ("Bluetooth", "find and connect to Bluetooth accessories.  This app may also use Bluetooth to know when you’re nearby")
        * [ ] `kTCCServiceFallDetection` (no visible effect, "Fall Detection Data", "receive data from Apple Watch if a fall is detected and follow up in case help is needed")
        * [ ] `kTCCServiceSiri` (no visible effect, "Some of your %@ data will be sent to Apple to process your requests")
        * [ ] `kTCCServiceBluetoothPeripheral` (no visible effect, "make data available to nearby Bluetooth devices even when you’re not using the app")
        * [ ] `kTCCServiceSpeechRecognition` ("Speech Recognition", "Access Speech Recognition", "Speech data from this app will be sent to Apple to process your requests. This will also help Apple improve its speech recognition technology")
        * [ ] `kTCCServicePrototype3Rights` (no visible effect, "Authorization to Test Service Proto3Right")
        * [x] `kTCCServiceMotion` ("Motion & Fitness", "Access Your Motion & Fitness Activity")
        * [ ] `kTCCServiceCalls` (no visible effect, "Receive VoIP Calls in the Background")
        * [0] `kTCCServiceCamera` ("Camera", "Access the Camera")
        * [0] `kTCCServiceMicrophone` ("Microphone", "Access the Microphone")
        * [x] `kTCCServiceWillow` ("Home Data", "Access Your Home Data")
    - Helpful reference of what the columns mean: https://rainforest.engineering/2021-02-09-macos-tcc/

### Location permission

Location permission is handled differently. 

```js
// To set:
// Traced using: frida-trace -U -m "*[CLLocationManager *]" Settings
// Works when run from Settings.
// Values (determined empirically, also see: https://developer.apple.com/documentation/corelocation/clauthorizationstatus/kclauthorizationstatusnotdetermined):
//   * 0: Ask Next Time
//   * 2: Never
//   * 3: Always
//   * 4: While Using the App
ObjC.classes.CLLocationManager.setAuthorizationStatusByType_forBundleIdentifier_(2, "com.bryceco.GoMap")

// To check:
ObjC.classes.CLLocationManager.authorizationStatus() // For the running app.
ObjC.classes.CLLocationManager.authorizationStatusForBundleIdentifier_("org.mozilla.ios.Firefox") // For an arbitrary app.
```

### Ideas

* https://github.com/lucaIz-ldx/ForceReset/blob/de004718c1ebde9a80dc686040853089ceea20a0/Tweak.x#L46-L54
* https://github.com/lucaIz-ldx/ForceReset/blob/master/Tweak.x#L125-L146
* https://github.com/lucaIz-ldx/ForceReset/blob/de004718c1ebde9a80dc686040853089ceea20a0/TCCFunctions.m#L60
* https://github.com/FouadRaheb/AppData/blob/eebc09cfb17375f04f5df08796754738d60b5e13/AppData/Classes/Model/ADAppData.m#L272-L280
* https://github.com/alexPNG/BegoneCIA

* https://frida.re/docs/examples/ios/
* https://frida.re/docs/javascript-api/#nativefunction
* https://gist.github.com/rustymagnet3000/605c333519cd265c7eac9d556f46dc75#frida-server

```objc
CFBundleRef bundle = CFBundleCreate(kCFAllocatorDefault, "com.apple.bla");
NSArray *array = TCCAccessCopyInformationForBundle(bundle);
```

```js
function bundleURL(id) {
    var all_apps = ObjC.classes.LSApplicationWorkspace.defaultWorkspace().allInstalledApplications();
    for (var i = 0; i < all_apps.count(); i++) {
        var app = all_apps.objectAtIndex_(i);
        if (app.bundleIdentifier().toString() == id) return app.bundleURL();
    }
}

var CFBundleCreate_addr = Module.findExportByName(null, "CFBundleCreate");
var CFBundleCreate = new NativeFunction(CFBundleCreate_addr, 'pointer', ['pointer', 'pointer']);

var kCFAllocatorDefault = Module.findExportByName(null, "kCFAllocatorDefault");

var b = bundleURL("com.bryceco.GoMap");
// var b = ObjC.classes.NSBundle.mainBundle().bundleURL();

// Can only access own bundle.
var bundle = CFBundleCreate(kCFAllocatorDefault, b);
// new ObjC.Object(bundle); // Maybe needed? You can call .toString() on that anyway.

// returns 0x0
// var TCCAccessCopyInformationForBundle_addr = Module.findExportByName("/System/Library/PrivateFrameworks/TCC.framework/TCC", "TCCAccessCopyInformationForBundle");
// var TCCAccessCopyInformationForBundle = new NativeFunction(TCCAccessCopyInformationForBundle_addr, "pointer", ["pointer"]);

var kTCCServiceAll = Module.findExportByName(null, "kTCCServiceAll");

// access violation
// var TCCAccessResetForBundle_addr = Module.findExportByName("/System/Library/PrivateFrameworks/TCC.framework/TCC", "TCCAccessResetForBundle");
// var TCCAccessResetForBundle = new NativeFunction(TCCAccessResetForBundle_addr, "bool", ["pointer", "pointer"]);
```

* https://codeshare.frida.re/@lichao890427/device--parameter/

```sh
#/bin/bash
# Adapted after: https://stackoverflow.com/a/53875499 and https://stackoverflow.com/a/29548123
NEEDLE="com.bryceco.GoMap"

find / -name '*.db' -print0 | while IFS= read -r -d '' file; do
    for X in $(sqlite3 $file .tables) ; do sqlite3 $file "SELECT * FROM $X;" | grep >/dev/null $NEEDLE && echo "Found in file '$file', table '$X'"; done
done
```

```
Found in file '/private/var/mobile/Library/Caches/com.apple.appstored/storeUser.db', table 'launch_events'
Found in file '/private/var/mobile/Library/Caches/com.apple.appstored/storeUser.db', table 'purchase_history_apps'
Found in file '/private/var/mobile/Library/Caches/com.apple.appstored/storeUser.db', table 'current_apps_crossfire'
Found in file '/private/var/mobile/Library/TCC/TCC.db', table 'access'
Found in file '/private/var/mobile/Library/DuetExpertCenter/_ATXDataStore.db', table 'anchorModelTrainingData'
Found in file '/private/var/mobile/Library/DuetExpertCenter/_ATXDataStore.db', table 'appInfo'
Found in file '/private/var/mobile/Library/FrontBoard/applicationState.db', table 'application_identifier_tab'
Found in file '/private/var/mobile/Library/FrontBoard/applicationState.db', table 'kvs_debug'
Found in file '/private/var/mobile/Library/CoreDuet/Knowledge/knowledgeC.db', table 'ZOBJECT'
Found in file '/private/var/Keychains/Analytics/trust_analytics.db', table 'hard_failures'
```


## Honey data

*Contact: Frank Walther, frank.walther.1978@icloud.com; `JGKfozntbF TBFFZbBYea`, 0155 57543434, `RYnlSPbEYh@bn.al`, `https://q8phlLSJgq.de`, `N2AsWEMI5D 565, 859663 p0GdKDTbYV`
* Location: Schreinerweg 6, 38126 Braunschweig; 52.235288, 10.564235
* Messages: `9FBqD2CNIJ` to +4917691377604
* Photos, videos, and screenshots
* Clipboard: `LDDsvPqQdT`
* Calendar: `fWAs4GFbpN`, at `urscf2178L`, 2021-08-14T08:56 – 2021-08-17T21:24, repeats every month, alarm
* Reminder: `b5jHg3Eh1k`, `HQBOdx4kx2` (scheduled for 2021-08-02T13:38)
* Note: `S0Ei7sFP9b`
* Voice memo
* Health details: Name `DkwIXobsJN t5TfTlezmn`, DOB 1973-05-15, female, height 146cm, weight 108.5kg 
* Home data: Rooms `bEZf1h06j1` (with wallpaper photo), `DX7BgPtH99` (basement); second home `g1bVNue3On` (with wallpaper photo)
* WiFi network: WLAN3.ALTPETER.ME
* Device name: `R2Gl5OLv20`
* OS version: 14.5.1
* Model no.: MX162ZD/A
* SN: FFMZP87VN1N0
* IMEI: 356395106788056
* WiFi addr: 3C:CD:36:D4:CC:E4
* Bluetooth addr: 3C:CD:36:D2:BD:B2
* Modem firmware: 4.03.05
* SEID: 044B24632…

## Settings:

* General
    - Background App Refresh: off (to hopefully minimize background network traffic)
* Privacy
    - Analytics & Improvements
        * Share iPhone Analytics: off
    - Apple Advertising
        * Personalised Ads: on (default)
* App Store
    - Automatic Downloads
        * Apps: off
        * App Updates: off

* Turn on Bluetooth.
* Uninstall all third-party apps that are not absolutely necessary.

## TODO

* [x] Disable PiHole!
* [x] Grant permissions?
* [x] Honey data
* [x] Clipboard seeding?
    - `ObjC.classes.UIPasteboard.generalPasteboard().setString_("LDDsvPqQdT")`
* [x] ~~Screenrecording?~~
* [x] Device settings?
* [ ] Is uninstalling enough?
* [ ] Add OkCupid to dataset

## Simon

* Personalised Ads setting?
* Limitation: Jailbreak detection
* Status complaint OkCupid
* How to Abgabe?
* Future work: Instead of only observing network traffic, actually trace interesting functions using Frida.
* Assume that people have seen the previous talk?

## References

* Activator commands:
    - `activator listeners` (https://jbguide.me/2016/url-schemes-after-jailbreak)
    - https://github.com/ArtikusHG/nimbus/blob/master/nimbus
    - https://junesiphone.com/actions/
    - https://www.reddit.com/r/iOStraverse/comments/3rx3sn/tutorial_activator_actions/
