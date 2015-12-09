default: test

build:
	npm install

DB_NAME=opencollective_localhost
DB_TEST_NAME=opencollective_test

dropdb:
	dropdb $(DB_NAME)
	dropdb $(DB_TEST_NAME)

database:
	# $(eval("psql -t -c \"SELECT datname FROM pg_catalog.pg_database WHERE lower(datname) = lower('$(DB_NAME)');\""))
	createdb $(DB_NAME)
	createdb $(DB_TEST_NAME)

test:
	@NODE_ENV=test ./node_modules/.bin/mocha \
	--timeout 5000 \
	--reporter spec \

circleci:
	@NODE_ENV=circleci mocha \
	--timeout 5000 \
	--reporter spec \

coverage:
	@NODE_ENV=test ./node_modules/istanbul/lib/cli.js cover \
		./node_modules/mocha/bin/_mocha -- \
		--timeout 5000 \
		--reporter spec \

clean:
	rm -rf node_modules
	rm -rf coverage

.PHONY: test coverage

