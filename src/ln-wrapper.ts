import { EBackendType, Una } from 'una-wrapper'
import { IConfig } from './i-config'

export function getLnWrapper(config: IConfig) {
    const lnConfig = config.node.lightning
    if (lnConfig.backend === EBackendType.LndRest) {
        const ln = lnConfig.lndRest
        if (!ln) throw new Error(`Missing configuration for ${EBackendType.LndRest}`)
        return new Una(EBackendType.LndRest, { url: ln.url, hexMacaroon: ln.hexMacaroon })
    } else if (lnConfig.backend === EBackendType.ClnRest) {
        const ln = lnConfig.clnRest
        if (!ln) throw new Error(`Missing configuration for ${EBackendType.ClnRest}`)
        return new Una(EBackendType.ClnRest, { url: ln.url, hexMacaroon: ln.hexMacaroon })
    } else if (lnConfig.backend === EBackendType.ClnSocketTcp) {
        const ln = lnConfig.clnSocketTcp
        if (!ln) throw new Error(`Missing configuration for ${EBackendType.ClnSocketTcp}`)
        return new Una(EBackendType.ClnSocketTcp, { host: ln.host, port: ln.port })
    } else if (lnConfig.backend === EBackendType.ClnSocketUnix) {
        const ln = lnConfig.clnSocketUnix
        if (!ln) throw new Error(`Missing configuration for ${EBackendType.ClnSocketUnix}`)
        return new Una(EBackendType.ClnSocketUnix, { path: ln.path })
    } else if (lnConfig.backend === EBackendType.EclairRest) {
        const ln = lnConfig.eclair
        if (!ln) throw new Error(`Missing configuration for ${EBackendType.EclairRest}`)
        return new Una(EBackendType.EclairRest, { url: ln.url, user: ln.user, password: ln.password })
    }
    throw new Error('LN configuration error')
}
