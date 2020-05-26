# Chronhib-Website

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 9.

## Intro

1. Download this github repo.
2. Run `npm install` to install node modules.
3. cd into client folder do above step `cd client`.
4. Import database into local mysql database `mysqldump -u root -p 'database_name' < test.sql`.

## Node Server

Run `ng start` from the root folder.
PS: Make sure you have the database imported via
the mysql server is running `sudo service mysql start`.

## Development server

Run `ng serve` from the client folder for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.
PS: Make sure the Node server is running before/while the dev server is running.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).