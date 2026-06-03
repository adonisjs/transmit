<div align="center">
  <h1> AdonisJS Transmit</h1>
  <p>A native Server-Sent-Event (SSE) module for AdonisJS.</p>
</div>

<br />

<div align="center">

[![typescript-image]][typescript-url]
[![gh-workflow-image]][gh-workflow-url]
[![npm-image]][npm-url]
[![npm-download-image]][npm-download-url]
[![license-image]][license-url]

</div>

<div align="center">
  <h3>
    <a href="#installation">
      Usage
    </a>
    <span> | </span>
    <a href="https://adonisjs.com">
      Checkout AdonisJS
    </a>
  </h3>
</div>

<br />

<hr />

AdonisJS Transmit is a native Server-Sent-Event (SSE) module for AdonisJS. It provides a simple API to send events to the client. It also supports [Redis](https://redis.io/) as a Transport Layer for broadcasting events to multiple servers or instances.

Here are a few things you should know before using this module.

<p>
👉 <strong>Unidirectional Communication:</strong> The data transmission occurs only from server to client, not the other way around.	<br />
👉 <strong>Textual Data Only:</strong> SSE only supports the transmission of textual data, binary data cannot be sent. <br />
👉 <strong>HTTP Protocol:</strong> The underlying protocol used is the regular HTTP, not any special or proprietary protocol.	<br />
</p>

## Table of Contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Installation](#installation)
- [Usage](#usage)
- [Channels](#channels)
  - [Channel Names](#channel-names)
  - [Channel Authorization](#channel-authorization)
- [Client](#client)
- [Syncing](#syncing)
- [Ping](#ping)
- [Events](#events)
- [Testing](#testing)
- [Avoiding GZip Interference](#avoiding-gzip-interference)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Installation

Install the package from the npm registry as follows:

```sh
node ace add @adonisjs/transmit
```

## Usage

The module exposes a `transmit` instance, which can be used to send events to the client.

```ts
import transmit from '@adonisjs/transmit/services/main'

// Anywhere in your code
transmit.broadcast('channelName', { username: 'lanz' })
```

## Channels

Channels are a way to group events. For example, you can have a channel for `users` and another for `posts`. The client can subscribe to one or more channels to receive events.

### Channel Names

Channels names must be a string and must not contain any special characters except `/`. The following are valid channel names.

```ts
transmit.broadcast('users', { username: 'lanz' })
transmit.broadcast('users/1', { username: 'lanz' })
transmit.broadcast('users/1/posts', { username: 'lanz' })
```

### Channel Authorization

You can mark a channel as private and then authorize the client to subscribe to it. The authorization is done using a callback function.

```ts
// start/transmit.ts

import type { HttpContext } from '@adonisjs/core/http'

transmit.authorize<{ id: string }>('users/:id', (ctx: HttpContext, { id }) => {
  return ctx.auth.user?.id === +id
})
```

> [!NOTE]
> Do not forget to add your `start/transmit.ts` file inside the `preloads` array of the `adonisrc.ts` file.

When a client tries to subscribe to a private channel, the callback function is invoked with the channel params and the HTTP context. The callback function must return a boolean value to allow or disallow the subscription.

The `ctx` passed to the callback only carries an authenticated user when the subscription request goes through your authentication middleware. By default, the routes used to subscribe and unsubscribe (`__transmit/subscribe` and `__transmit/unsubscribe`) are public, so `ctx.auth.user` is `undefined`. Use `transmit.registerRoutes` to protect them:

```ts
// start/routes.ts

import transmit from '@adonisjs/transmit/services/main'
import { middleware } from '#start/kernel'

transmit.registerRoutes((route) => {
  // Authenticate the client before it can subscribe to a channel
  if (route.getPattern() === '__transmit/subscribe') {
    route.middleware(middleware.auth())
    return
  }
})
```

> [!NOTE]
> Once the subscribe route is authenticated, `ctx.auth.user` is available inside your `authorize` callbacks, allowing you to scope private channels to the current user.

## Client

The `@adonisjs/transmit-client` package lets you connect to the server, subscribe to channels and react to incoming messages.

```sh
npm i @adonisjs/transmit-client
```

Create a client by pointing it to your server. When your subscribe route is authenticated (see [Channel Authorization](#channel-authorization)), use the `beforeSubscribe` hook to attach your credentials to every subscription request. The hook receives the outgoing `Request`, so you can mutate its headers directly.

```ts
import { Transmit } from '@adonisjs/transmit-client'

export const transmit = new Transmit({
  baseUrl: window.location.origin,
  beforeSubscribe: (request) => {
    request.headers.set('Authorization', `Bearer ${getToken()}`)
  },
})
```

Then subscribe to a channel and listen for messages:

```ts
const subscription = transmit.subscription('users/1')
await subscription.create()

subscription.onMessage((message) => {
  console.log(message)
})

// Stop receiving messages
await subscription.delete()
```

> [!NOTE]
> If you also protect the unsubscribe route, use the matching `beforeUnsubscribe` hook to authenticate `__transmit/unsubscribe` requests the same way.

# Syncing

Transmit supports syncing events across multiple servers or instances using a transport layer. You can enable syncing by changing the configuration and referencing your driver (only Redis is available as of now).

```ts
// config/transmit.ts
import env from '#start/env'
import { defineConfig } from '@adonisjs/transmit'
import { redis } from '@adonisjs/transmit/transports'

export default defineConfig({
  transport: {
    driver: redis({
      host: env.get('REDIS_HOST'),
      port: env.get('REDIS_PORT'),
      password: env.get('REDIS_PASSWORD'),
    }),
  },
})
```

> [!NOTE]
> Ensure to have `ioredis` installed when using the `redis` driver.

# Ping

Transmit supports pinging the client to keep the connection alive. You can enable pinging by changing the configuration.

```ts
// config/transmit.ts
import { defineConfig } from '@adonisjs/transmit'
import { redis } from '@adonisjs/transmit/transports'

export default defineConfig({
  pingInterval: '1m',
})
```

# Events

Transmit uses [Emittery](https://github.com/sindresorhus/emittery) to emit any lifecycle events. You can listen for events using the `on` method.

```ts
transmit.on('broadcast', ({ channel, payload }) => {
  logger.debug('TRANSMIT broadcasted')
  logger.debug(`─ channel: ${channel}`)
  logger.debug(`─ payload: ${JSON.stringify(payload)}`)
})

transmit.on('connect', ({ uid }) => {
  logger.debug('TRANSMIT connected')
  logger.debug(`─ uid: ${uid}`)
})

transmit.on('disconnect', ({ uid }) => {
  logger.debug('TRANSMIT disconnected')
  logger.debug(`─ uid: ${uid}`)
})

transmit.on('subscribe', ({ channel, uid }) => {
  logger.debug('TRANSMIT subscribed')
  logger.debug(`─ channel: ${channel}`)
  logger.debug(`─ uid: ${uid}`)
})

transmit.on('unsubscribe', ({ channel, uid }) => {
  logger.debug('TRANSMIT unsubscribed')
  logger.debug(`─ channel: ${channel}`)
  logger.debug(`─ uid: ${uid}`)
})
```

The `connect` and `disconnect` events expose the `uid` of the client. Combined with [Channel Authorization](#channel-authorization), you can map this `uid` to the authenticated user to keep track of who is currently connected.

# Testing

Because `transmit.on` returns a function to stop listening, you can collect the broadcasts emitted while hitting your endpoints and assert on them. The following example uses [Japa](https://japa.dev) with the `@japa/api-client` plugin:

```ts
import transmit from '@adonisjs/transmit/services/main'
import { test } from '@japa/runner'

test.group('Posts', () => {
  test('it broadcasts the created post', async ({ client, assert }) => {
    const broadcasts: { channel: string; payload: unknown }[] = []
    const stopListening = transmit.on('broadcast', (event) => broadcasts.push(event))

    const response = await client.post('/posts').loginAs(user)

    stopListening()

    assert.equal(response.status(), 201)
    assert.lengthOf(broadcasts, 1)
    assert.equal(broadcasts[0].channel, `users/${user.id}`)
  })

  test('it rejects an unauthenticated subscription', async ({ client, assert }) => {
    const response = await client.post('/__transmit/subscribe').json({ channel: 'users/1' })

    assert.equal(response.status(), 401)
  })
})
```

# Avoiding GZip Interference

When deploying applications that use `@adonisjs/transmit`, it’s important to ensure that GZip compression does not interfere with the `text/event-stream` content type used by Server-Sent Events (SSE). Compression applied to `text/event-stream` can cause connection issues, leading to frequent disconnects or SSE failures.

If your deployment uses a reverse proxy (such as Traefik or Nginx) or other middleware that applies GZip, ensure that compression is disabled for the `text/event-stream` content type.

## Example Configuration for Traefik

```plaintext
traefik.http.middlewares.gzip.compress=true
traefik.http.middlewares.gzip.compress.excludedcontenttypes=text/event-stream
traefik.http.routers.my-router.middlewares=gzip
```

[gh-workflow-image]: https://img.shields.io/github/actions/workflow/status/adonisjs/transmit/checks.yml?branch=3.x&style=for-the-badge
[gh-workflow-url]: https://github.com/adonisjs/transmit/actions/workflows/checks.yml 'GitHub action'
[npm-image]: https://img.shields.io/npm/v/@adonisjs/transmit.svg?style=for-the-badge&logo=npm
[npm-url]: https://www.npmjs.com/package/@adonisjs/transmit
[npm-download-image]: https://img.shields.io/npm/dm/@adonisjs/transmit?style=for-the-badge
[npm-download-url]: https://www.npmjs.com/package/@adonisjs/transmit
[typescript-image]: https://img.shields.io/badge/Typescript-294E80.svg?style=for-the-badge&logo=typescript
[typescript-url]: https://www.typescriptlang.org
[license-image]: https://img.shields.io/npm/l/@rlanz/bus?color=blueviolet&style=for-the-badge
[license-url]: LICENSE.md
