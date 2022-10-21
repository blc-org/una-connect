import { relayPool } from 'nostr-tools'
import { onReceiveEvent } from './receive.js'
import EventEmitter from 'events'
import fs from 'node:fs/promises'
import { IConfig } from './i-config.js'
import { getLnWrapper } from './ln-wrapper.js'

export const config: IConfig = JSON.parse(await fs.readFile('./config.json', { encoding: 'utf-8' }))

export const unaWrapper = getLnWrapper(config)

const pubKey = config.node.nostr.pubKey

export const pool = relayPool()

pool.setPrivateKey(config.node.nostr.privKey)

const initEvent = new EventEmitter()
export let finishedEventIds: string[] = []

initEvent.on('initialized', () => {
    for (const relay of config.relays) {
        pool.addRelay(relay, { read: true, write: true })
    }

    console.log('Una-connect initialized')
    pool.sub({
        cb: onReceiveEvent,
        // @ts-ignore
        filter: {
            kinds: [4],
            authors: config.services.map((s) => s.pubKey),
            '#p': [pubKey],
        },
    })
})

export async function updateFinishedEvents(eventId: string) {
    const events = [...finishedEventIds, eventId]
    await fs.writeFile('./events.json', JSON.stringify(events))
    finishedEventIds = events
}

async function init() {
    try {
        const events = JSON.parse(await fs.readFile('./events.json', { encoding: 'utf-8' }))
        finishedEventIds = events
        initEvent.emit('initialized')
    } catch (error) {
        console.error('Critical error when decoding events.json', error)
        process.exit(1)
    }
}

init()
