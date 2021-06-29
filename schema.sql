create table if not exists apps
(
    name text not null
        constraint app_pk
            primary key,
    version text
);

alter table apps owner to ios;

create table if not exists runs
(
    id serial not null
        constraint run_pk
            primary key,
    start_time timestamp with time zone,
    end_time timestamp with time zone,
    app text
        constraint run_app_name_fk
            references apps
                on delete cascade
);

alter table runs owner to ios;

create table if not exists requests
(
    id serial not null
        constraint request_pk
            primary key,
    run integer
        constraint request_run_id_fk
            references runs
                on delete cascade,
    start_time timestamp with time zone not null,
    method varchar(10) not null,
    host text not null,
    path text not null,
    content text,
    content_raw bytea not null,
    port integer,
    scheme text not null,
    authority text,
    http_version text not null
);

alter table requests owner to ios;

create table if not exists headers
(
    id serial not null
        constraint headers_pk
            primary key,
    request integer
        constraint table_name_requests_id_fk
            references requests
                on delete cascade,
    name text not null,
    values text[]
);

alter table headers owner to ios;

create table if not exists cookies
(
    id serial not null
        constraint cookies_pk
            primary key,
    request integer
        constraint table_name_requests_id_fk
            references requests
                on delete cascade,
    name text not null,
    values text[]
);

alter table cookies owner to ios;

create table if not exists trailers
(
    id      serial not null
        constraint trailers_pk
            primary key,
    request integer
        constraint table_name_requests_id_fk
            references trailers
            on delete cascade,
    name    text   not null,
    values  text[]
);

alter table trailers
    owner to ios;


-- This schema is based on the work for the "Do they track? Automated analysis of Android apps for privacy violations"
-- research project (https://benjamin-altpeter.de/doc/presentation-android-privacy.pdf). The initial version is
-- licensed under the following license:
--
-- The MIT License
--
-- Copyright 2020 – 2021 Malte Wessels
--
-- Permission is hereby granted, free of charge, to any person obtaining a copy
-- of this software and associated documentation files (the "Software"), to deal
-- in the Software without restriction, including without limitation the rights
-- to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
-- copies of the Software, and to permit persons to whom the Software is
-- furnished to do so, subject to the following conditions:
--
-- The above copyright notice and this permission notice shall be included in all
-- copies or substantial portions of the Software.
--
-- THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
-- IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
-- FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
-- AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
-- LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
-- OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
-- SOFTWARE.
