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
