from mitmproxy import ctx, http
import json
import itertools


class ThreeU:
    def __init__(self):
        with open("top.json", "r") as j:
            data = json.load(j)
            nested_data = [x["contentData"] for x in data]
            self.apps = list(itertools.chain.from_iterable(nested_data))

    def response(self, flow: http.HTTPFlow):
        if(flow.request.pretty_url == "http://app.pcres.3u.com/app_list.action"):
            i = int(flow.request.urlencoded_form.get("page")) - 1
            apps = self.apps[0+i*20:20+i*20]
            res_apps = [{
                "versionid": "0",
                "icon": f"https://via.placeholder.com/100?text={a['buyData']['bundle-id']}",
                "sort": 1,
                "itemid": a['id'],
                "shortversion": "1.0.0",
                "downloaded": "3",
                "isfull": 0,
                "version": "1.0.0",
                "id": idx + i * 20,
                "slogancolor": "#f0f0f0",
                "slogan": a['name'],
                "appname": a['name'],
                "md5": "",
                "sourceid": a['buyData']['bundle-id'],
                "path": "",
                "minversion": a['buyData']['minimum-os-version'],
                "sizebyte": a['buyData']['file-size'],
                "longversion": a['buyData']['minimum-os-version'],
                "pkagetype": 1
            } for idx, a in enumerate(apps)]
            res = {
                "success": True,
                "type": 104,
                "list": res_apps,
                "co": 20
            }
            flow.response.content = json.dumps(res).encode("utf-8")
        pass


addons = [
    ThreeU()
]
