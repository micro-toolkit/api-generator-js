[![Build Status](https://travis-ci.org/micro-toolkit/api-generator-js.svg?branch=master)](https://travis-ci.org/micro-toolkit/api-generator-js)
[![Code Climate](https://codeclimate.com/github/micro-toolkit/api-generator-js/badges/gpa.svg)](https://codeclimate.com/github/micro-toolkit/api-generator-js)
[![Test Coverage](https://codeclimate.com/github/micro-toolkit/api-generator-js/badges/coverage.svg)](https://codeclimate.com/github/micro-toolkit/api-generator-js/coverage)
[![Issue Count](https://codeclimate.com/github/micro-toolkit/api-generator-js/badges/issue_count.svg)](https://codeclimate.com/github/micro-toolkit/api-generator-js)
[![Dependency Status](https://gemnasium.com/micro-toolkit/api-generator-js.svg)](https://gemnasium.com/micro-toolkit/api-generator-js)

# Micro Toolkit API Generators

[![npm](https://img.shields.io/npm/v/micro-toolkit-api-generators.svg)](https://www.npmjs.com/package/micro-toolkit-api-generators)

The Micro toolkit API generators will allow you to generate express handlers to connect to the micro toolkit services using a set of code conventions.

The generator is based on the concept of models that are described using metadata. Every model have a microservice associated to, this service should have required operations available.

Following the api example we have 2 models:
* task: representing a todo task item, that is associated with a user;
* user: representing the user, that can have a list of task associated to;

The metadata files that describe the models, present on each version, should have the following format:

Property    | Description
------------|------------
properties  | A whitelist of properties associated with the model, only this properties are returned by the api serialization.
relations   | A collection of relations associated with the model.
actions     | A list of actions available on the model (list, get, create, remove, update).

```javascript
var taskMetadata = {
  properties: [ "id", "userId", "active" ],
  relations: [
    {
      name: "user",
      type: "resource"
    }
  ],
  actions: ["list", "get", "create", "update", "remove"]
}
```

The list of actions will be translated into the following actions:
* list:   `GET /v1/tasks`
* get:    `GET /v1/tasks/:id`
* create: `POST /v1/tasks`
* update: `PUT /v1/tasks/:id`
* remove: `DELETE /v1/tasks/:id`

The relations will result on the following endpoints depending on the type:
* resource:   `GET /v1/users/:id`
* collection: `GET /v1/users/:id/tasks`

## Install

    $ npm install micro-toolkit-api-generator --save

## Usage

The metadata should be dictionary where each key identifies the version identifier and the value should be a dictionary with the models description.

```javascript
// metadata from api-example project
var metadata = {
  v1: {
    task: {
      properties: [ "id", "userId", "active" ],
      relations: [
        {
          name: "user",
          type: "resource"
        }
      ],
      actions: ["list", "get", "create", "update", "remove"]
    },
    user: {
      properties: [ "id", "name" ],
      relations: [
        {
          "name": "tasks",
          "type": "collection"
        }
      ],
      "actions": ["get"]
    }
  }
};
```

## Expose the api routes

The following snipets will allow you to add the api generator routes into a express application. To configure logger plugins check the [project instructions](https://github.com/micro-toolkit/logger-facade-nodejs).

```javascript
var express = require('express');
var apiRouter = require('../../index');

var config = {
  runtimeConfig: { baseUrl: 'http://localhost:8081' },
  // metadata from api-example project
  metadata: metadata
};
var app = express();
var router = apiRouter(config);
app.use(router);
app.listen(8081);
```

## Forwarding claims to service

The api generators allow to forward request claims into the microservice using the microservice header property on call. The api generator will use `req.user` to whitelist the claims selected. To use this feature the application just need to use a middleware to set `req.user` and define the whitelisted properties using the following configuration.

```javascript
var express = require('express');
var apiRouter = require('../../index');

var config = {
  runtimeConfig: {
    baseUrl: 'http://localhost:8081',
    claims: 'userId,tenantId'
  },
  // metadata from api-example project
  metadata: metadata
};
var app = express();
var router = apiRouter(config);
// emulate auth middlware
app.use(function(req, res, next){
  var claims = { userId: '1', tenantId: '2' };
  req.user = claims;
  next();
});
app.use(router);
app.listen(8081);
```

## Excluding some parameters from query string

By default the api generators will forward to the service all query string parameters except token. To override this configuration and have control over it the application can specificly set wich parameters to filter.


```javascript
var config = {
  runtimeConfig: {
    baseUrl: 'http://localhost:8081',
    excludeQueryString: 'token,somethingElse'
  },
  // metadata from api-example project
  metadata: metadata
};
```

## Support non standard actions

The default supported actions are `list, get, create, remove, update`, but the toolkit also support non standard action over a resource.

See following metadata example:

```javascript
// metadata from api-example project
var metadata = {
  v1: {
    user: {
      properties: [ "id", "name", "active" ],
      relations: [
        {
          name: "tasks",
          type: "collection"
        }
      ],
      actions: [
        "get",
        { name: "active", httpVerb: "PUT", verb: "activate" },
        { name: "active", httpVerb: "DELETE", verb: "deactivate" }
      ]
    }

  }
};
```

The previous metadata will generate the following routes:

* `PUT /v1/users/:id/active` - that will call verb `activate` on the service, this operation should return the user model serialization
* `DELETE /v1/users/:id/active` - that will call verb `deactivate` on the service, this operation will not return any response body from the api

**NOTE**

At the moment the only support http verbs are: `PUT, POST, DELETE`. The `PUT, POST` verbs should return the model serialization.

## Support subresource models

If we have a model that is dependent on a parent model, we can configure it in the model. This configuration will make the api routes being dependent on the parent resource routes.

As an example we can have the following model configuration (metadata from api-example project):

```json
{
  "parent": "user",
  "properties": [ "id", "name", "userId"],
  "actions": ["list", "get", "create", "update", "remove"],
  "relations": [
    {
      "name": "user",
      "type": "resource"
    }
  ]
}
```

This will generate the following routes:

    API::METADATA::INFO - Loaded API Models...
    API::METADATA::INFO - Loading API routes...
    API::METADATA::INFO - Mount route GET     /v1/users/:userId/roles
    API::METADATA::INFO - Mount route GET     /v1/users/:userId/roles/:id
    API::METADATA::INFO - Mount route POST    /v1/users/:userId/roles
    API::METADATA::INFO - Mount route PUT     /v1/users/:userId/roles/:id
    API::METADATA::INFO - Mount route DELETE  /v1/users/:userId/roles/:id
    ...
    API::METADATA::INFO - Loaded API routes...
    API::INFO - Server running on port 8081

The parameters `userId` and `id`(on resource endpoints only) will be sent to service on payload.

## Support path prefix

If we have a model that needs to have a prefix path we may configure it using path key. This configuration will make the api routes prefixed with the path.

As an example we can have the following model configuration (metadata from api-example project):

```json
{
  "properties": [ "name", "userId" ],
  "relations": [{ "name": "user", "type": "resource" }],
  "actions": ["list"],
  "path": {
    "prefix": "admin/"
  }
}
```

This will generate the following routes:

    API::METADATA::INFO - Loaded API Models...
    API::METADATA::INFO - Loading API routes...
    API::METADATA::INFO - Mount route GET 	/v1/admin/claims

## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request

## Bump versioning

We use [grunt bump package](https://www.npmjs.org/package/grunt-bump) to control package versioning.

Bump Patch version

    $ grunt bump

Bump Minor version

    $ grunt bump:minor

Bump Major version

    $ grunt bump:major

## Running Specs

    $ npm test

## Coverage Report

We aim for 100% coverage and we hope it keeps that way! :)
We use pre-commit and pre-push hooks and CI to accomplish this, so don't mess with our build! :P

Check the report after running npm test.

    $ open ./coverage/lcov-report/index.html
