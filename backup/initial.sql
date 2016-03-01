--
-- PostgreSQL database dump
--

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;

--
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


SET search_path = public, pg_catalog;

--
-- Name: enum_Groups_membership_type; Type: TYPE; Schema: public; Owner: philmod
--

CREATE TYPE "enum_Groups_membership_type" AS ENUM (
    'donation',
    'monthlyfee',
    'yearlyfee'
);


ALTER TYPE public."enum_Groups_membership_type" OWNER TO philmod;

--
-- Name: enum_UserGroups_role; Type: TYPE; Schema: public; Owner: philmod
--

CREATE TYPE "enum_UserGroups_role" AS ENUM (
    'admin',
    'writer',
    'viewer'
);


ALTER TYPE public."enum_UserGroups_role" OWNER TO philmod;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: Activities; Type: TABLE; Schema: public; Owner: philmod; Tablespace: 
--

CREATE TABLE "Activities" (
    id integer NOT NULL,
    type character varying(255),
    data json,
    "createdAt" timestamp with time zone,
    "GroupId" integer,
    "UserId" integer,
    "TransactionId" integer
);


ALTER TABLE public."Activities" OWNER TO philmod;

--
-- Name: Activities_id_seq; Type: SEQUENCE; Schema: public; Owner: philmod
--

CREATE SEQUENCE "Activities_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Activities_id_seq" OWNER TO philmod;

--
-- Name: Activities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: philmod
--

ALTER SEQUENCE "Activities_id_seq" OWNED BY "Activities".id;


--
-- Name: ApplicationGroup; Type: TABLE; Schema: public; Owner: philmod; Tablespace: 
--

CREATE TABLE "ApplicationGroup" (
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "GroupId" integer NOT NULL,
    "ApplicationId" integer NOT NULL
);


ALTER TABLE public."ApplicationGroup" OWNER TO philmod;

--
-- Name: Applications; Type: TABLE; Schema: public; Owner: philmod; Tablespace: 
--

CREATE TABLE "Applications" (
    id integer NOT NULL,
    api_key character varying(255),
    name character varying(255),
    href character varying(255),
    description character varying(255),
    disabled boolean DEFAULT false,
    _access double precision DEFAULT 0,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone
);


ALTER TABLE public."Applications" OWNER TO philmod;

--
-- Name: Applications_id_seq; Type: SEQUENCE; Schema: public; Owner: philmod
--

CREATE SEQUENCE "Applications_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Applications_id_seq" OWNER TO philmod;

--
-- Name: Applications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: philmod
--

ALTER SEQUENCE "Applications_id_seq" OWNED BY "Applications".id;


--
-- Name: Cards; Type: TABLE; Schema: public; Owner: philmod; Tablespace: 
--

CREATE TABLE "Cards" (
    id integer NOT NULL,
    number character varying(255),
    token character varying(255),
    "serviceId" character varying(255),
    service character varying(255) DEFAULT 'stripe'::character varying,
    data json,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone,
    "confirmedAt" timestamp with time zone,
    "deletedAt" timestamp with time zone,
    "UserId" integer,
    "GroupId" integer
);


ALTER TABLE public."Cards" OWNER TO philmod;

--
-- Name: Cards_id_seq; Type: SEQUENCE; Schema: public; Owner: philmod
--

CREATE SEQUENCE "Cards_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Cards_id_seq" OWNER TO philmod;

--
-- Name: Cards_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: philmod
--

ALTER SEQUENCE "Cards_id_seq" OWNED BY "Cards".id;


--
-- Name: Groups; Type: TABLE; Schema: public; Owner: philmod; Tablespace: 
--

CREATE TABLE "Groups" (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(255),
    budget double precision,
    currency character varying(255) DEFAULT 'USD'::character varying,
    membership_type "enum_Groups_membership_type",
    membershipfee double precision,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone,
    "deletedAt" timestamp with time zone,
    "StripeManagedAccountId" integer
);


ALTER TABLE public."Groups" OWNER TO philmod;

--
-- Name: Groups_id_seq; Type: SEQUENCE; Schema: public; Owner: philmod
--

CREATE SEQUENCE "Groups_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Groups_id_seq" OWNER TO philmod;

--
-- Name: Groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: philmod
--

ALTER SEQUENCE "Groups_id_seq" OWNED BY "Groups".id;


--
-- Name: Paykeys; Type: TABLE; Schema: public; Owner: philmod; Tablespace: 
--

CREATE TABLE "Paykeys" (
    id integer NOT NULL,
    "trackingId" character varying(255),
    paykey character varying(255),
    status character varying(255),
    payload json,
    data json,
    error json,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone,
    "deletedAt" timestamp with time zone,
    "TransactionId" integer
);


ALTER TABLE public."Paykeys" OWNER TO philmod;

--
-- Name: Paykeys_id_seq; Type: SEQUENCE; Schema: public; Owner: philmod
--

CREATE SEQUENCE "Paykeys_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Paykeys_id_seq" OWNER TO philmod;

--
-- Name: Paykeys_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: philmod
--

ALTER SEQUENCE "Paykeys_id_seq" OWNED BY "Paykeys".id;


--
-- Name: StripeManagedAccounts; Type: TABLE; Schema: public; Owner: philmod; Tablespace: 
--

CREATE TABLE "StripeManagedAccounts" (
    id integer NOT NULL,
    "stripeId" character varying(255),
    "stripeSecret" character varying(255),
    "stripeKey" character varying(255),
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone,
    "deletedAt" timestamp with time zone
);


ALTER TABLE public."StripeManagedAccounts" OWNER TO philmod;

--
-- Name: StripeManagedAccounts_id_seq; Type: SEQUENCE; Schema: public; Owner: philmod
--

CREATE SEQUENCE "StripeManagedAccounts_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."StripeManagedAccounts_id_seq" OWNER TO philmod;

--
-- Name: StripeManagedAccounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: philmod
--

ALTER SEQUENCE "StripeManagedAccounts_id_seq" OWNED BY "StripeManagedAccounts".id;


--
-- Name: Transactions; Type: TABLE; Schema: public; Owner: philmod; Tablespace: 
--

CREATE TABLE "Transactions" (
    id integer NOT NULL,
    type character varying(255),
    description character varying(255),
    amount double precision,
    currency character varying(255) DEFAULT 'USD'::character varying,
    vendor character varying(255),
    paidby character varying(255),
    tags character varying(255)[],
    status character varying(255),
    comment character varying(255),
    link character varying(255),
    approved boolean DEFAULT false,
    "createdAt" timestamp with time zone,
    "approvedAt" timestamp with time zone,
    "reimbursedAt" timestamp with time zone,
    "updatedAt" timestamp with time zone NOT NULL,
    "GroupId" integer,
    "UserId" integer,
    "CardId" integer
);


ALTER TABLE public."Transactions" OWNER TO philmod;

--
-- Name: Transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: philmod
--

CREATE SEQUENCE "Transactions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Transactions_id_seq" OWNER TO philmod;

--
-- Name: Transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: philmod
--

ALTER SEQUENCE "Transactions_id_seq" OWNED BY "Transactions".id;


--
-- Name: UserGroups; Type: TABLE; Schema: public; Owner: philmod; Tablespace: 
--

CREATE TABLE "UserGroups" (
    role "enum_UserGroups_role",
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone,
    "deletedAt" timestamp with time zone,
    "UserId" integer NOT NULL,
    "GroupId" integer NOT NULL
);


ALTER TABLE public."UserGroups" OWNER TO philmod;

--
-- Name: Users; Type: TABLE; Schema: public; Owner: philmod; Tablespace: 
--

CREATE TABLE "Users" (
    id integer NOT NULL,
    _access integer DEFAULT 0,
    first_name character varying(255),
    last_name character varying(255),
    username character varying(255),
    avatar character varying(255),
    email character varying(255) NOT NULL,
    _salt character varying(255) DEFAULT '$2a$10$z7WeTPzeRqOEAHa7iou9be'::character varying,
    refresh_token character varying(255) DEFAULT '$2a$10$0clIXo.fK5iqIdrS1Uy8zO'::character varying,
    password_hash character varying(255),
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone,
    "seenAt" timestamp with time zone,
    "deletedAt" timestamp with time zone,
    "ApplicationId" integer
);


ALTER TABLE public."Users" OWNER TO philmod;

--
-- Name: Users_id_seq; Type: SEQUENCE; Schema: public; Owner: philmod
--

CREATE SEQUENCE "Users_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Users_id_seq" OWNER TO philmod;

--
-- Name: Users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: philmod
--

ALTER SEQUENCE "Users_id_seq" OWNED BY "Users".id;


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: philmod
--

ALTER TABLE ONLY "Activities" ALTER COLUMN id SET DEFAULT nextval('"Activities_id_seq"'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: philmod
--

ALTER TABLE ONLY "Applications" ALTER COLUMN id SET DEFAULT nextval('"Applications_id_seq"'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: philmod
--

ALTER TABLE ONLY "Cards" ALTER COLUMN id SET DEFAULT nextval('"Cards_id_seq"'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: philmod
--

ALTER TABLE ONLY "Groups" ALTER COLUMN id SET DEFAULT nextval('"Groups_id_seq"'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: philmod
--

ALTER TABLE ONLY "Paykeys" ALTER COLUMN id SET DEFAULT nextval('"Paykeys_id_seq"'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: philmod
--

ALTER TABLE ONLY "StripeManagedAccounts" ALTER COLUMN id SET DEFAULT nextval('"StripeManagedAccounts_id_seq"'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: philmod
--

ALTER TABLE ONLY "Transactions" ALTER COLUMN id SET DEFAULT nextval('"Transactions_id_seq"'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: philmod
--

ALTER TABLE ONLY "Users" ALTER COLUMN id SET DEFAULT nextval('"Users_id_seq"'::regclass);


--
-- Data for Name: Activities; Type: TABLE DATA; Schema: public; Owner: philmod
--

COPY "Activities" (id, type, data, "createdAt", "GroupId", "UserId", "TransactionId") FROM stdin;
\.


--
-- Name: Activities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: philmod
--

SELECT pg_catalog.setval('"Activities_id_seq"', 1, false);


--
-- Data for Name: ApplicationGroup; Type: TABLE DATA; Schema: public; Owner: philmod
--

COPY "ApplicationGroup" ("createdAt", "updatedAt", "GroupId", "ApplicationId") FROM stdin;
\.


--
-- Data for Name: Applications; Type: TABLE DATA; Schema: public; Owner: philmod
--

COPY "Applications" (id, api_key, name, href, description, disabled, _access, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Name: Applications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: philmod
--

SELECT pg_catalog.setval('"Applications_id_seq"', 1, false);


--
-- Data for Name: Cards; Type: TABLE DATA; Schema: public; Owner: philmod
--

COPY "Cards" (id, number, token, "serviceId", service, data, "createdAt", "updatedAt", "confirmedAt", "deletedAt", "UserId", "GroupId") FROM stdin;
\.


--
-- Name: Cards_id_seq; Type: SEQUENCE SET; Schema: public; Owner: philmod
--

SELECT pg_catalog.setval('"Cards_id_seq"', 1, false);


--
-- Data for Name: Groups; Type: TABLE DATA; Schema: public; Owner: philmod
--

COPY "Groups" (id, name, description, budget, currency, membership_type, membershipfee, "createdAt", "updatedAt", "deletedAt", "StripeManagedAccountId") FROM stdin;
\.


--
-- Name: Groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: philmod
--

SELECT pg_catalog.setval('"Groups_id_seq"', 1, false);


--
-- Data for Name: Paykeys; Type: TABLE DATA; Schema: public; Owner: philmod
--

COPY "Paykeys" (id, "trackingId", paykey, status, payload, data, error, "createdAt", "updatedAt", "deletedAt", "TransactionId") FROM stdin;
\.


--
-- Name: Paykeys_id_seq; Type: SEQUENCE SET; Schema: public; Owner: philmod
--

SELECT pg_catalog.setval('"Paykeys_id_seq"', 1, false);


--
-- Data for Name: StripeManagedAccounts; Type: TABLE DATA; Schema: public; Owner: philmod
--

COPY "StripeManagedAccounts" (id, "stripeId", "stripeSecret", "stripeKey", "createdAt", "updatedAt", "deletedAt") FROM stdin;
\.


--
-- Name: StripeManagedAccounts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: philmod
--

SELECT pg_catalog.setval('"StripeManagedAccounts_id_seq"', 1, false);


--
-- Data for Name: Transactions; Type: TABLE DATA; Schema: public; Owner: philmod
--

COPY "Transactions" (id, type, description, amount, currency, vendor, paidby, tags, status, comment, link, approved, "createdAt", "approvedAt", "reimbursedAt", "updatedAt", "GroupId", "UserId", "CardId") FROM stdin;
\.


--
-- Name: Transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: philmod
--

SELECT pg_catalog.setval('"Transactions_id_seq"', 1, false);


--
-- Data for Name: UserGroups; Type: TABLE DATA; Schema: public; Owner: philmod
--

COPY "UserGroups" (role, "createdAt", "updatedAt", "deletedAt", "UserId", "GroupId") FROM stdin;
\.


--
-- Data for Name: Users; Type: TABLE DATA; Schema: public; Owner: philmod
--

COPY "Users" (id, _access, first_name, last_name, username, avatar, email, _salt, refresh_token, password_hash, "createdAt", "updatedAt", "seenAt", "deletedAt", "ApplicationId") FROM stdin;
\.


--
-- Name: Users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: philmod
--

SELECT pg_catalog.setval('"Users_id_seq"', 1, false);


--
-- Name: Activities_pkey; Type: CONSTRAINT; Schema: public; Owner: philmod; Tablespace: 
--

ALTER TABLE ONLY "Activities"
    ADD CONSTRAINT "Activities_pkey" PRIMARY KEY (id);


--
-- Name: ApplicationGroup_pkey; Type: CONSTRAINT; Schema: public; Owner: philmod; Tablespace: 
--

ALTER TABLE ONLY "ApplicationGroup"
    ADD CONSTRAINT "ApplicationGroup_pkey" PRIMARY KEY ("GroupId", "ApplicationId");


--
-- Name: Applications_pkey; Type: CONSTRAINT; Schema: public; Owner: philmod; Tablespace: 
--

ALTER TABLE ONLY "Applications"
    ADD CONSTRAINT "Applications_pkey" PRIMARY KEY (id);


--
-- Name: Cards_pkey; Type: CONSTRAINT; Schema: public; Owner: philmod; Tablespace: 
--

ALTER TABLE ONLY "Cards"
    ADD CONSTRAINT "Cards_pkey" PRIMARY KEY (id);


--
-- Name: Groups_pkey; Type: CONSTRAINT; Schema: public; Owner: philmod; Tablespace: 
--

ALTER TABLE ONLY "Groups"
    ADD CONSTRAINT "Groups_pkey" PRIMARY KEY (id);


--
-- Name: Paykeys_paykey_key; Type: CONSTRAINT; Schema: public; Owner: philmod; Tablespace: 
--

ALTER TABLE ONLY "Paykeys"
    ADD CONSTRAINT "Paykeys_paykey_key" UNIQUE (paykey);


--
-- Name: Paykeys_pkey; Type: CONSTRAINT; Schema: public; Owner: philmod; Tablespace: 
--

ALTER TABLE ONLY "Paykeys"
    ADD CONSTRAINT "Paykeys_pkey" PRIMARY KEY (id);


--
-- Name: StripeManagedAccounts_pkey; Type: CONSTRAINT; Schema: public; Owner: philmod; Tablespace: 
--

ALTER TABLE ONLY "StripeManagedAccounts"
    ADD CONSTRAINT "StripeManagedAccounts_pkey" PRIMARY KEY (id);


--
-- Name: Transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: philmod; Tablespace: 
--

ALTER TABLE ONLY "Transactions"
    ADD CONSTRAINT "Transactions_pkey" PRIMARY KEY (id);


--
-- Name: UserGroups_pkey; Type: CONSTRAINT; Schema: public; Owner: philmod; Tablespace: 
--

ALTER TABLE ONLY "UserGroups"
    ADD CONSTRAINT "UserGroups_pkey" PRIMARY KEY ("UserId", "GroupId");


--
-- Name: Users_email_key; Type: CONSTRAINT; Schema: public; Owner: philmod; Tablespace: 
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "Users_email_key" UNIQUE (email);


--
-- Name: Users_pkey; Type: CONSTRAINT; Schema: public; Owner: philmod; Tablespace: 
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "Users_pkey" PRIMARY KEY (id);


--
-- Name: Users_username_key; Type: CONSTRAINT; Schema: public; Owner: philmod; Tablespace: 
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "Users_username_key" UNIQUE (username);


--
-- Name: Activities_GroupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: philmod
--

ALTER TABLE ONLY "Activities"
    ADD CONSTRAINT "Activities_GroupId_fkey" FOREIGN KEY ("GroupId") REFERENCES "Groups"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Activities_TransactionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: philmod
--

ALTER TABLE ONLY "Activities"
    ADD CONSTRAINT "Activities_TransactionId_fkey" FOREIGN KEY ("TransactionId") REFERENCES "Transactions"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Activities_UserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: philmod
--

ALTER TABLE ONLY "Activities"
    ADD CONSTRAINT "Activities_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "Users"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ApplicationGroup_ApplicationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: philmod
--

ALTER TABLE ONLY "ApplicationGroup"
    ADD CONSTRAINT "ApplicationGroup_ApplicationId_fkey" FOREIGN KEY ("ApplicationId") REFERENCES "Applications"(id);


--
-- Name: ApplicationGroup_GroupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: philmod
--

ALTER TABLE ONLY "ApplicationGroup"
    ADD CONSTRAINT "ApplicationGroup_GroupId_fkey" FOREIGN KEY ("GroupId") REFERENCES "Groups"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Cards_GroupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: philmod
--

ALTER TABLE ONLY "Cards"
    ADD CONSTRAINT "Cards_GroupId_fkey" FOREIGN KEY ("GroupId") REFERENCES "Groups"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Cards_UserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: philmod
--

ALTER TABLE ONLY "Cards"
    ADD CONSTRAINT "Cards_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "Users"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Groups_StripeManagedAccountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: philmod
--

ALTER TABLE ONLY "Groups"
    ADD CONSTRAINT "Groups_StripeManagedAccountId_fkey" FOREIGN KEY ("StripeManagedAccountId") REFERENCES "StripeManagedAccounts"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Paykeys_TransactionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: philmod
--

ALTER TABLE ONLY "Paykeys"
    ADD CONSTRAINT "Paykeys_TransactionId_fkey" FOREIGN KEY ("TransactionId") REFERENCES "Transactions"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Transactions_CardId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: philmod
--

ALTER TABLE ONLY "Transactions"
    ADD CONSTRAINT "Transactions_CardId_fkey" FOREIGN KEY ("CardId") REFERENCES "Cards"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Transactions_GroupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: philmod
--

ALTER TABLE ONLY "Transactions"
    ADD CONSTRAINT "Transactions_GroupId_fkey" FOREIGN KEY ("GroupId") REFERENCES "Groups"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Transactions_UserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: philmod
--

ALTER TABLE ONLY "Transactions"
    ADD CONSTRAINT "Transactions_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "Users"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UserGroups_GroupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: philmod
--

ALTER TABLE ONLY "UserGroups"
    ADD CONSTRAINT "UserGroups_GroupId_fkey" FOREIGN KEY ("GroupId") REFERENCES "Groups"(id);


--
-- Name: UserGroups_UserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: philmod
--

ALTER TABLE ONLY "UserGroups"
    ADD CONSTRAINT "UserGroups_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Users_ApplicationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: philmod
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "Users_ApplicationId_fkey" FOREIGN KEY ("ApplicationId") REFERENCES "Applications"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: public; Type: ACL; Schema: -; Owner: arnaudbenard
--

REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM arnaudbenard;
GRANT ALL ON SCHEMA public TO arnaudbenard;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--

