import { getPublicKey, generatePrivateKey } from 'nostr-tools'
import fs from 'node:fs/promises'
import { IConfig } from './i-config'

const privKey = generatePrivateKey()
const pubKey = getPublicKey(Buffer.from(privKey, 'hex'))

async function init() {
    const config: IConfig = {
        node: {
            nostr: {
                privKey,
                pubKey,
            },
            lightning: {
                //@ts-ignore
                backend: '',
                lndRest: {
                    url: '',
                    hexMacaroon: '',
                },
                clnRest: {
                    url: '',
                    hexMacaroon: '',
                },
                clnSocketTcp: {
                    host: '',
                    port: 0,
                },
                clnSocketUnix: {
                    path: '',
                },
                eclair: {
                    url: '',
                    user: '',
                    password: '',
                },
            },
        },
        services: [{ pubKey: '', authorizations: [] }],
        relays: [
            'wss://nostr-pub.wellorder.net',
            'wss://nostr-relay.wlvs.space',
            'wss://nostr-relay.untethr.me',
            'wss://nostr.openchain.fr',
        ],
    }
    await fs.writeFile('./config.json', JSON.stringify(config))
    await fs.writeFile('./events.json', JSON.stringify([]))
    console.log('Node initialized')
    console.log('Your private key: ' + privKey)
    console.log('Your public key: ' + pubKey)
}

init()
