# RFC Frontend 001 - Cutting Edge

## Abstract

The Javascript ecosystem is moving fast, new version of libraries are regularly released, best practices are evolving.

If nothing is done, dependencies in Javascript projects are getting outdated really quickly. This is generating a lot of noise: deprecation notices, security warnings, etc ... When updates are piling up, it's becoming time consuming and complicated to move forward. 

To avoid being in this situation, the path is to be extremely pro-active, manage updates on a day to day basis, assisted by automation and continuous integration systems.

## Resolution

 - By default, always use the latest stable version of our dependencies.
 - When it's not possible to easily upgrade, open a ticket to properly document the issue.
 - The continuous upgrade process should be automated in our development workflow.
