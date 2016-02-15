[![Build Status](https://travis-ci.org/micro-toolkit/api-generator-js.svg?branch=master)](https://travis-ci.org/micro-toolkit/api-generator-js)

# Micro Toolkit API Generators

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
actions     | A list of actions available on the model (all, get, create, remove, update).

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
