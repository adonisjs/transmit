<div align="center">
  <h1> AdonisJS Transmit</h1>
  <p>A native Server-Sent-Event (SSE) module for AdonisJS.</p>
</div>

<br />

<div align="center">

[![gh-workflow-image]][gh-workflow-url] [![npm-image]][npm-url] ![][typescript-image] [![license-image]][license-url] [![snyk-image]][snyk-url]

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
- [Syncing](#syncing)
- [Events](#events)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Installation

Install the package from the npm registry as follows:

```sh
npm i @adonisjs/transmit
```

```sh
node ace configure @adonisjs/transmit
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

transmit.authorizeChannel<{ id: string }>('users/:id', (ctx: HttpContext, { id }) => {
  return ctx.auth.user?.id === +id
})
```

> **NOTE**
> Do not forget to add your `start/transmit.ts` file inside the `preloads` array of the `adonisrc.ts` file.

When a client tries to subscribe to a private channel, the callback function is invoked with the channel params and the HTTP context. The callback function must return a boolean value to allow or disallow the subscription.

# Syncing

Transmit supports syncing events across multiple servers or instances using a transport layer. You can enable syncing by changing the configuration and referencing your driver (only Redis is available as of now).

```ts
// config/transmit.ts
import { defineConfig, RedisTransport } from '@adonisjs/transmit'

export default defineConfig({
  transport: {
    driver: RedisTransport
  }
})
```

# Events

Transmit uses [Emittery](https://github.com/sindresorhus/emittery) to emit any lifecycle events. You can listen for events using the `on` method.

```ts
transmit.on('connect', ({ uid }) => {
  console.log(`Connected: ${uid}`)
})

transmit.on('disconnect', ({ uid }) => {
  console.log(`Disconnected: ${uid}`)
})

transmit.on('broadcast', ({ channel }) => {
  console.log(`Broadcasted to channel ${channel}`)
})

transmit.on('subscribe', ({ uid, channel }) => {
  console.log(`Subscribed ${uid} to ${channel}`)
})

transmit.on('unsubscribe', ({ uid, channel }) => {
  console.log(`Unsubscribed ${uid} from ${channel}`)
})
```

[gh-workflow-image]: https://img.shields.io/github/actions/workflow/status/adonisjs/transmit/test?style=for-the-badge
[gh-workflow-url]: https://github.com/adonisjs/transmit/actions/workflows/test.yml 'GitHub action'
[typescript-image]: https://img.shields.io/badge/Typescript-294E80.svg?style=for-the-badge&logo=typescript
[typescript-url]: "typescript"
[npm-image]: https://img.shields.io/npm/v/@adonisjs/transmit.svg?style=for-the-badge&logo=npm
[npm-url]: https://npmjs.org/package/@adonisjs/transmit 'npm'
[license-image]: https://img.shields.io/npm/l/@adonisjs/transmit?color=blueviolet&style=for-the-badge
[license-url]: LICENSE.md 'license'
[snyk-image]: https://img.shields.io/snyk/vulnerabilities/github/adonisjs/transmit?label=Snyk%20Vulnerabilities&style=for-the-badge
[snyk-url]: https://snyk.io/test/github/adonisjs/transmit?targetFile=package.json 'snyk'
