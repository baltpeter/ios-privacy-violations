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
