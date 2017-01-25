DB_NAME=opencollective_localhost
DB_TEST_NAME=opencollective_test

dropdb:
	dropdb $(DB_NAME)
	dropdb $(DB_TEST_NAME)

database:
	createdb $(DB_NAME)
	createdb $(DB_TEST_NAME)
	psql -U postgres -d opencollective_localhost -c 'CREATE EXTENSION POSTGIS;'
	psql -U postgres -d opencollective_test -c 'CREATE EXTENSION POSTGIS;'
