const { base64Regex } = require('./util');

const getRequestsForIndicator = async (db, strings, bundle_id = undefined) => {
    const raw_conditions = strings.map(
        (s) => `content ILIKE '%${s}%' OR content_raw LIKE '%${s}%' OR path ILIKE '%${s}%'`
    );
    const base64_conditions = strings.map((s) => base64Regex(s)).map((r) => `content ~ '${r}' OR path ~ '${r}'`);
    const name_filter = bundle_id ? `name = '${bundle_id}'` : 'True';
    const query = `SELECT name, fr.id from apps join runs on apps.name = runs.app join filtered_requests fr on runs.id = fr.run
    WHERE ${name_filter} AND (${[...raw_conditions, ...base64_conditions].join('\n       OR ')});`;
    return await db.manyOrNone(query);
};

module.exports = { getRequestsForIndicator };
