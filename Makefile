DB_NAME=opencollective_localhost
DB_TEST_NAME=opencollective_test

dropdb:
	dropdb $(DB_NAME)
	dropdb $(DB_TEST_NAME)

database:
	createdb $(DB_NAME)
	createdb $(DB_TEST_NAME)
