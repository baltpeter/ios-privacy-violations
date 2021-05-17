# Notes

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

### macOS

* On M1 Macs: Installing iOS apps is possible if allowed by developer: https://www.macrumors.com/2021/01/15/m1-macs-sideloading-ios-apps-no-longer-possible/

## Obtaining iOS apps

* IPA files are compiled for ARM and can only be run on physical devices? https://docs.appetize.io/core-features/uploading-apps
* Installing unsigned IPAs is possible through AppSync Unified (from Cydia): https://cydia.akemi.ai/?page/net.angelxwind.appsyncunified
* Third-party software that claims to be able to download IPAs: https://imazing.com/guides/how-to-manage-apps-without-itunes
* Downloading IPAs also seems to be possible through Apple Configurator: https://apple.stackexchange.com/a/298455
* Was also possible with iTunes 12.6.5. Can this version still be downloaded/used?: https://apple.stackexchange.com/a/301720
* https://github.com/dpnishant/appmon/wiki/8.-Usage-Guide:-AppMon-IPA-Installer

## Potentially interesting links

* https://spaceraccoon.dev/from-checkra1n-to-frida-ios-app-pentesting-quickstart-on-ios-13
* Starting apps using Frida: https://github.com/AloneMonkey/frida-ios-dump/blob/56e99b2138fc213fa759b3aeb9717a1fb4ec6a59/dump.py#L253
* http://cydia.saurik.com/package/com.ethanrdoesmc.truecuts/
* https://autotouch.net/
* https://github.com/ios-control/ios-deploy
* https://steipete.com/posts/jailbreaking-for-ios-developers/
* https://www.supercharge.app/
* https://github.com/nabla-c0d3/ssl-kill-switch2
* https://github.com/dpnishant/appmon/wiki/4.c.i-Creating-a-iOS-Developer-Profile
* http://www.cydiaimpactor.com/
* https://github.com/DanTheMan827/ios-app-signer
* https://cokepokes.github.io/depiction/appstoreplus.html
* https://mobile-security.gitbook.io/mobile-security-testing-guide/ios-testing-guide/0x06b-basic-security-testing
* https://www.npmjs.com/package/itms-services (for downloading OTA? apps)
* https://github.com/chaitin/passionfruit

* https://libimobiledevice.org/
* https://cydia.akemi.ai/?page/com.linusyang.appinst

## Device

* iPhone 8
* A11
* SN: FFMZP87VN1N0
* IMEI: 356395106788056

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
