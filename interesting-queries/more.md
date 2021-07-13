# Data types with lots of results

Query:

```sql
SELECT name, r2.* from apps join runs r on apps.name = r.app join filtered_requests r2 on r.id = r2.run
    WHERE content ILIKE '%${query}%' OR content_raw LIKE '%${query}%' OR path ILIKE '%${query}%';
```

* Geolocation: `52.2352`
* Device name: `R2Gl5OLv20`

## Interesting queries

* Apps using PayPal SDK and sending the same data
    - `com.modanisa.iPhone`: `21839`, `21844`, `21845`
    - `com.ebay.iphone`: `10090`

## Observations

* 74 apps without any requests, including various banking TAN apps, Signal, and TeleGuard but also Facebook, and Zoom.
* 1618 requests with `idfa` (always `00000000-0000-0000-0000-000000000000`).
* 1981 requests with `idfv` (e.g. `D21097DA-862E-4F22-B316-01DBE7E1A31C`, different for each vendor).
* Example requests from Android presentation:
    - Indeed: no Appsflyer this time
    - Audible: almost identical (`5407`)
    - ESPN: not in dataset
    - Bitmoji: identical (`6571`)
    - Audiomack: not in dataset
    - PayPal: very similar (`33730`, `33729`, `33731`)
* Filter list data
    - Total requests: 34925, requests after filtering: 30439
