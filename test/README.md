# Testing

## Organization

Tests are organized to match source's hierarchy, especially regarding the `server` folder.

## What to test

We expect tests to be as contained and specialized as possible. A lot of legacy tests are
testing features through their GraphQL endpoints. While it's good to test these endpoints
to check the response and error types, testing entire features and their edge cases should
be done at the lowest level possible: usually the library, the model or by calling the
query/mutation resolver directly.
