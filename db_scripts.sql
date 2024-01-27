-- DB & tables
CREATE DATABASE port if not exists;


create table ferry ( 
    id uuid PRIMARY KEY,
    name character varying(200) not null,
    car_place integer NOT NULL,
    load_place integer NOT NULL)
    ;

create table destination ( 
    id UUID PRIMARY KEY ,
    name VARCHAR(200) not null)
;


create table trip ( 
    id UUID PRIMARY KEY ,
    ferry_id UUID REFERENCES ferry,
    dest_id UUID REFERENCES destination,
    loads UUID[] default '{}',
    position integer)
;


create table load (
    id UUID PRIMARY KEY ,
    name VARCHAR(200) not null,
    type VARCHAR(4) not null,
    car_type VARCHAR(10),
    trip_id UUID REFERENCES trip,
    position integer)
;



-- User (actions: select, insert, update, delete)
--
--CREATE ROLE pm_admin LOGIN ENCRYPTED PASSWORD 'admin';
--GRANT  select, insert, update, delete on load, ferry, destination, trip TO pm_admin;
--
