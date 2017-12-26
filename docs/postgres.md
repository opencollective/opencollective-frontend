# Database

For development, ensure that local connections do not require a password. Locate your `pg_hba.conf` file by running `SHOW hba_file;` from the psql prompt (`sudo -i -u postgres` + `psql` after clean install). This should look something like `/etc/postgresql/9.5/main/pg_hba.conf`. We'll call the parent directory of `pg_hba.conf` the `$POSTGRES_DATADIR`. `cd` to `$POSTGRES_DATADIR`, and edit `pg_hba.conf` to `trust` local socket connections and local IP connections. Restart `postgres` - on Mac OS X, there may be restart scripts already in place with `brew`, if not use `pg_ctl -D $POSTGRES_DATADIR restart`.

Now, assuming the postgres database superuser is `postgres`, let's create the databases.
```
createdb -U postgres opencollective_dvl
createdb -U postgres opencollective_test
createuser -U postgres opencollective
psql -U postgres
> GRANT ALL PRIVILEGES ON DATABASE opencollective_dvl TO opencollective;
> GRANT ALL PRIVILEGES ON DATABASE opencollective_test TO opencollective;
```