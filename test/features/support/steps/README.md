# Steps

The **steps** available in a *BDD* setup define what tests can be
written. This directory contains steps for multiple scenarios. They're
loosely grouped by what feature they're related to. Constant
refactoring might be needed here.

## 0

This is our canary test. If this test doesn't run, the test system is
most likely broken.

## setup

 * `Before`: Reset test database. It uses the `sequelize.sync()`
   function to get the DB into a clean slate before each scenario.

 * `AfterAll`: Closes the database connection so cucumber doesn't get
   the node process stuck. We could also just call cucumber with
   `--exit` but closing the database allows us to know when code that
   would actually leak an asynchronous call is added.
