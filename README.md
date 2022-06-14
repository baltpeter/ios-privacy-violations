# Automated analysis of “zero-touch” privacy violations under iOS

>  Source code, presentation, and notes for my university research project on “zero-touch” privacy violations on iOS ([presentation](https://benjamin-altpeter.de/doc/presentation-ios-privacy.pdf)).

As a follow-up project to the [Android privacy research](https://benjamin-altpeter.de/doc/presentation-android-privacy.pdf), I also looked at the iOS ecosystem. At the time, research into data protection on iOS had been scarce and outdated and there was no prior art for automatically acquiring and analysing apps. The presentation details the many dead ends I ran into on the way to a working solution and my process of reverse-engineering how to programmatically grant permissions on iOS.

I ended up analysing 1,001 apps from the top charts of the German App Store as of May 2021. The results are very similar to those on Android. I found that apps on iOS also frequently perform tracking even without user input (or much less consent), collecting the same data types. Even the list of the most common trackers is almost identical.
Finally, I also had a quick look at Apple’s then new privacy labels. Most of the declarations were correct but I did find some apps transmitting data they omitted in their privacy label.

To learn more, check out my [presentation](https://benjamin-altpeter.de/doc/presentation-ios-privacy.pdf) on the project.

The source code for this project was also used for the “Keeping Privacy Labels Honest” paper ([preprint](https://web.archive.org/web/20220614215606/https://www.tu-braunschweig.de/index.php?eID=dumpFile&t=f&f=142319&token=eaf5740028b015a987464fd46f2dca6d88f1a8dd)), to be published at [PETS’22](https://petsymposium.org/2022/paperlist.php). The full source code for that paper can be found in the [Keeping-Privacy-Labels-Honest](https://github.com/Keeping-Privacy-Labels-Honest) organization.

## LICENSE

This code is licensed under the MIT license, see the [`LICENSE`](LICENSE) file for details.
