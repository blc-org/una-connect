import { EBackendType } from 'una-wrapper'
import { EAction } from './receive'

interface Nostr {
    privKey: string
    pubKey: string
}

interface Lightning {
    backend: EBackendType
    lndRest?: {
        url: string
        hexMacaroon: string
    }
    clnRest?: {
        url: string
        hexMacaroon: string
    }
    clnSocketTcp?: {
        host: string
        port: number
    }
    clnSocketUnix?: {
        path: string
    }
    eclair?: {
        url: string
        user: string
        password: string
    }
}

interface Node {
    nostr: Nostr
    lightning: Lightning
}

interface Service {
    pubKey: string
    authorizations: EAction[]
}

export interface IConfig {
    node: Node
    services: Service[]
    relays: string[]
}
