import type { Stream } from './stream.js'

export class StorageBag {
  #subscribers = new Map<Stream, Set<string>>()
  #channelByUid = new Map<string, Set<string>>()

  push(stream: Stream) {
    const channels = new Set<string>()
    this.#subscribers.set(stream, channels)
    this.#channelByUid.set(stream.getUid(), channels)
  }

  remove(stream: Stream) {
    this.#subscribers.delete(stream)
    this.#channelByUid.delete(stream.getUid())
  }

  addChannelToStream(uid: string, channel: string): boolean {
    const channels = this.#channelByUid.get(uid)

    if (!channels) return false

    channels.add(channel)

    return true
  }

  removeChannelFromStream(uid: string, channel: string): boolean {
    const channels = this.#channelByUid.get(uid)

    if (!channels) return false

    channels.delete(channel)

    return true
  }

  findByChannel(channel: string) {
    const subscribers = new Set<Stream>()

    for (const [stream, streamChannels] of this.#subscribers) {
      if (streamChannels.has(channel)) {
        subscribers.add(stream)
      }
    }

    return subscribers
  }
}
