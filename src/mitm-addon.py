from dotenv import load_dotenv
import os
import sys
from datetime import datetime
import mitmproxy
from mitmproxy import http, ctx
from mitmproxy.coretypes import multidict
import psycopg2
from psycopg2.extras import execute_values

load_dotenv()

conn, cur = None, None
run_id: int
running_already_called = False


def mdv_to_dict(mdv: multidict) -> dict:
    """
    mitmproxy uses an internal datastructure which allows multiple values for one key.
    This function converts this into a (key, array) dict. It tries to decode the values and keys as well.
    """
    tmp = dict()
    if not mdv:
        return tmp
    for t in mdv.fields:
        # as we only use this for headers and cookies I assume utf-8, else we replace the char
        try:
            key = str(t[0], encoding='utf-8', errors="replace")
        except TypeError:
            key = t[0]
        try:
            tmp[key] = [str(x, encoding='utf-8', errors="replace") for x in t[1:]]
        except TypeError:
            # if only some are not bytestrings than the bytestrings won't be decoded
            # I don't want to handle this here, if this occurs I'll write a clean-up script
            tmp[key] = [str(x) for x in t[1:]]
    return tmp


def request(flow: http.HTTPFlow):
    r: http.HTTPRequest = flow.request
    cur.execute(
        "INSERT INTO requests (run, start_time, host, port, method, scheme, authority, path, http_version, content_raw) VALUES(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id;",
        (run_id, datetime.fromtimestamp(r.timestamp_start), r.pretty_host, r.port, r.method, r.scheme, r.authority,
         r.path,
         r.http_version, r.content))
    request_id: int = cur.fetchone()[0]
    conn.commit()
    # try to decode the content and update the row
    try:
        decoded: str = r.content.decode()
        cur.execute("UPDATE requests SET content = %s  WHERE id = %s", (decoded, request_id))
        conn.commit()
    except ValueError:
        pass
    # headers
    decoded_headers: dict = mdv_to_dict(r.headers)
    if len(decoded_headers) > 0:
        # print([(request_id, k, v) for k, v in decoded_headers.items()])
        execute_values(cur, "INSERT INTO headers (request, name, values) VALUES %s",
                       [(request_id, k, v) for k, v in decoded_headers.items()])
        conn.commit()

    # trailers
    decoded_trailers: dict = mdv_to_dict(r.trailers)
    if decoded_trailers and len(decoded_trailers) > 0:
        # print([(request_id, k, v) for k, v in decoded_trailers.items()])
        execute_values(cur, "INSERT INTO trailers (request, name, values) VALUES %s",
                       [(request_id, k, v) for k, v in decoded_trailers.items()])
        conn.commit()

    # cookies
    decoded_cookies: dict = mdv_to_dict(r.cookies)
    if len(decoded_cookies) > 0:
        # print([(request_id, k, v) for k, v in decoded_headers.items()])
        execute_values(cur, "INSERT INTO cookies (request, name, values) VALUES %s",
                       [(request_id, k, v) for k, v in decoded_cookies.items()])
        conn.commit()


def load(loader: mitmproxy.addonmanager.Loader):
    global conn, cur
    loader.add_option(
        name="appname",
        typespec=str,
        default='',
        help="The name of the emulated app"
    )
    conn = psycopg2.connect(host='localhost', port=os.environ['HOST_PORT'], dbname=os.environ['POSTGRES_DB'], user=os.environ['POSTGRES_USER'], password=os.environ['POSTGRES_PASSWORD'])
    cur = conn.cursor()


def running():
    global run_id, running_already_called
    # https://github.com/mitmproxy/mitmproxy/issues/3584 *facepalm*
    if running_already_called:
        return
    else:
        running_already_called = True

    if not ctx.options.appname:
        print("App not specified, shutting down.. (Hint: Use --set appname=name)", file=sys.stderr)
        ctx.master.shutdown()
    # create run entry in row
    try:
        cur.execute("INSERT INTO runs (start_time, app) VALUES(now(), %s) RETURNING id;",
                    (ctx.options.appname,))
        run_id = cur.fetchone()[0]
    except:
        print("Could not create run, shutting down.. (Hint: Have you inserted the app into the db before?)", file=sys.stderr)
        ctx.master.shutdown()
    conn.commit()


def done():
    cur.execute("UPDATE runs SET end_time = now() WHERE id=%s", (run_id,))  # TODO: better end-time?
    conn.commit()
    conn.close()


# This script is based on the work for the "Do they track? Automated analysis of Android apps for privacy violations"
# research project (https://benjamin-altpeter.de/doc/presentation-android-privacy.pdf), which is licensed under the
# following license:
#
# The MIT License
#
# Copyright 2020 – 2021 Malte Wessels
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.
