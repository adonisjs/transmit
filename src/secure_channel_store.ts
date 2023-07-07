import matchit from '@poppinss/matchit'

export class SecureChannelStore {
  #securedChannelsDefinition: any[] = []

  add(channel: string) {
    const encodedDefinition = matchit.parse(channel)

    this.#securedChannelsDefinition.push(encodedDefinition)
  }

  match(channel: string) {
    const matchedChannel = matchit.match(channel, this.#securedChannelsDefinition)

    if (matchedChannel) {
      const params = matchit.exec(channel, matchedChannel)
      return { params, url: matchedChannel[0].old }
    }
  }
}
