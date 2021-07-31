# Presentation

* Is emulation an option?
    - iOS simulator
    - Appetize.io and Run that app: essentially iOS simulator
    - Corellium
* Device preparation
    - Jailbreak
    - mitmproxy [https://www.andyibanez.com/posts/intercepting-network-mitmproxy/#physical-ios-devices]
    - https://github.com/nabla-c0d3/ssl-kill-switch2
* Obtaining apps
    - TODO
    - Top apps
        * Official RSS feed: https://rss.itunes.apple.com/en-us (only first 200, though)
        * Old app store API: http://itunes.apple.com/WebObjects/MZStore.woa/wa/topChartFragmentData?cc=de&genreId=36&pageSize=120&popId=27&pageNumbers=0,1,2,3,4,5,6,7,8,9 (1200) [https://stackoverflow.com/a/30134648, https://stackoverflow.com/a/58776183, https://42matters.com/docs/app-market-data/ios/apps/appstore-genres]
* Automation
    - macOS has Configurator
        * Install app: `cfgutil install-app <file>.ipa`
        * Uninstall app: `cfgutil remove-app <bundle-id>`
    - Linux has libimobiledevice
        * Install app: `ideviceinstaller --install <file>.ipa`
        * Uninstall app: `ideviceinstaller --uninstall <bundle-id>`
    - For the rest, we just SSH into the device and use Activator (https://cydia.saurik.com/package/libactivator/). *shrug* 
        * Press home button: `activator send libactivator.system.homebutton`
        * Open app: `activator send <bundle-id>`
* More automation
    - Granting permissions
        * https://objective-see.com/blog/blog_0x4C.html suggests that macOS uses TCC for permissions, maybe iOS does as well?
        * `tccutil` unfortunately doesn't exist but there is a `tccd` process running!
        * A bit of `find` leads us to `/private/var/mobile/Library/TCC/TCC.db`, specifically the table `access`.
        * After a bit of trial and error:
            - `auth_value == 0` means permission not granted, `auth_value == 2` means permission granted.
        * Still missing: list of possible permssions
            - `/System/Library/PrivateFrameworks/TCC.framework/en.lproj/Localizable.strings` to the rescue
        * Table
        * Screenshot of flashlight app or whatever with "ALL THE PERMISSIONS!"
    - No location permission, though.
        * Well, we already know that Apple apparently likes to store info like this in sqlite databases…
        * ```sh
          #/bin/bash
          # Adapted after: https://stackoverflow.com/a/53875499 and https://stackoverflow.com/a/29548123
          NEEDLE="com.bryceco.GoMap"
          
          find / -name '*.db' -print0 | while IFS= read -r -d '' file; do
              for X in $(sqlite3 $file .tables) ; do sqlite3 $file "SELECT * FROM $X;" | grep >/dev/null $NEEDLE && echo "Found in file '$file', table '$X'"; done
          done
          ```
        * Does yield results but not what we are looking for:

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
        * Found more prior art. https://github.com/lucaIz-ldx/ForceReset/blob/master/Tweak.x#L151-L154 suggests existence of `CLLocationManager`. Do I have to write ObjC app?
        * Remembered Frida. Using that, relatively quickly found `ObjC.classes.CLLocationManager.setAuthorizationStatusByType_forBundleIdentifier_(int, "com.bryceco.GoMap")` but that doesn't work.
        * Almost gave up but `frida-trace` on Settings apps. Shows this exact call…
        * Trial and error yields:
            - 0: Ask Next Time
            - 2: Never
            - 3: Always
            - 4: While Using the App
        * For reference, if you want to check:
          ```js
          ObjC.classes.CLLocationManager.authorizationStatus(); // For the running app.
          ObjC.classes.CLLocationManager.authorizationStatusForBundleIdentifier_("org.mozilla.ios.Firefox"); // For an arbitrary app.
          ```
    - Clipboard seeding
        * `ObjC.classes.UIPasteboard.generalPasteboard().setString_(string);`
* Background noise filter (TODO: not sure if this is the right spot)
    - Apple has a very helpful support pages that explains (most) background connections: https://support.apple.com/en-us/HT210060
        * ```js
          $$('tr').filter(e => e.children[3].textContent.includes('iOS')).map(e => e.children).map(c => ([c[0].textContent, c[4].textContent])).map(i => `requests.host ${i[0].includes('*') ? '~~' : '='} '${i[0].replace(/\*/g, '%')}' -- "${i[1]}" (${window.location})`).join('\nAND NOT ')
          ```
* TODO: Honey data?
* Privacy labels
    - TODO
* Results
    - TODO
