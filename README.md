# Una-connect

Connect any application to your node without disclosing your node information

## Prerequisite

1. Install Node.js (only v18 tested)

## Getting started

1. Get Una-connect
- `git clone https://github.com/blc-org/una-connect`
- `cd una-connect`
- `yarn install`
- `yarn build`

2. Scaffold your node
- `npm run scaffold`

This command will generate 2 files. `config.json` and `events.json`
- `events.json` is the file where event ids has been processed. You don't need to do anything with this file
- `config.json` is your configuration file. It looks like this
```json
{
    // "node" is your personnal (and secret) configuration part
    "node": {
        // nostr.privKey and nostr.pubKey will be generated automatically
        "nostr": {
            "privKey": "",
            "pubKey": ""
        },
        // Your Lightning node configuration. Chose one of the supported backend
        "lightning": {
            "backend": "", // LndRest, ClnRest, ClnSocketTcp, ClnSocketUnix, Eclair
            "lndRest": {
                "url": "",
                "hexMacaroon": ""
            },
            "clnRest": {
                "url": "",
                "hexMacaroon": ""
            },
            "clnSocketTcp": {
                "host": "",
                "port": 0
            },
            "clnSocketUnix": {
                "path": ""
            },
            "eclair": {
                "url": "",
                "user": "",
                "password": ""
            }
        }
    },
    // "services" are services where you want them to control your node
    "services": [
        {
            "pubKey": "", // the Nostr pubKey of the service you want to authorize
            "authorizations": [
                "createInvoice", "payInvoice"
            ]
        }
    ],
    // a list of nostr relays. You need to put at least one (more is better) same used by services
    "relays": [
        "wss://nostr-pub.wellorder.net"
    ]
}
```

3. Launch
- `npm run start`

## Actions

Actions are JSON sent by an authorized service to control your node. It uses [encrypted direct message (NIP-04)](https://github.com/nostr-protocol/nips/blob/master/04.md) and have to be authorized in your `config.json` file.

1. `createInvoice`
```json
{"action": "createInvoice", "createInvoice": {"amount": 1000, "description": "Hello from Una-connect!"}}
```

2. `payInvoice`
```json
{"action": "payInvoice", "payInvoice": {"bolt11": "lnbcrt10u1p34...yufwppz6cp69j0zh"}}
```

## Development

- `yarn dev:build` compile (+ watch changes) TS files into js files
- `yarn dev:start` launch (+ watch changes) Una-connect