// @ts-ignore
import { decrypt, encrypt } from 'nostr-tools/nip04.js'
import { IInvoice } from 'una-wrapper'
import { config, finishedEventIds, pool, unaWrapper, updateFinishedEvents } from './index.js'
import { Mutex } from 'async-mutex'

const mutex = new Mutex()

// @ts-ignore
export async function onReceiveEvent(event, relay) {
    await mutex.runExclusive(async () => {
        if (finishedEventIds.includes(event.id)) {
            console.log('Event id already processed', event.id)
            return
        }

        if (event.kind === 4) {
            const instruction = decrypt(config.node.nostr.privKey, event.pubkey, event.content)
            await handleAction(event, instruction)
        }
    })
}

export enum EAction {
    createInvoice = 'createInvoice',
    payInvoice = 'payInvoice',
}
interface IInstruction {
    action: EAction

    createInvoice: {
        amount: number
        description: string | null
    }
    payInvoice: {
        bolt11: string
    }
}
async function handleAction(event: any, instruction: string) {
    if (validateInstruction(event.pubkey, instruction)) {
        const parsed: IInstruction = JSON.parse(instruction)
        console.log(`Action ${parsed.action} received. Event id ${event.id}`)
        if (parsed.action === EAction.createInvoice) {
            await createInvoice(event.pubkey, {
                amount: parsed.createInvoice.amount,
                description: parsed.createInvoice.description,
            })
        }
        if (parsed.action === EAction.payInvoice) {
            await payInvoice(event.pubkey, { bolt11: parsed.payInvoice.bolt11 })
        }
    } else {
        console.log(`Cannot validate instruction for event ${event.id}. Skip.`)
    }
    await updateFinishedEvents(event.id)
}

async function createInvoice(
    receiverPubKey: string,
    { amount, description }: { amount: number; description: string | null },
) {
    // @ts-ignore
    const invoice = await unaWrapper.createInvoice({ amount, description: description ?? '' })
    await sendResult(receiverPubKey, invoice)
}

async function payInvoice(receiverPubKey: string, { bolt11 }: { bolt11: string }) {
    // @ts-ignore
    const invoice = await unaWrapper.payInvoice({ bolt11 })
    await sendResult(receiverPubKey, invoice)
}

async function sendResult(receiverPubKey: string, result: IInvoice | unknown) {
    const event = {
        kind: 4,
        pubkey: config.node.nostr.pubKey,
        content: encrypt(config.node.nostr.privKey, receiverPubKey, JSON.stringify(result)),
        tags: [['p', receiverPubKey]],
        created_at: Math.round(Date.now() / 1000),
    }
    // @ts-ignore
    await pool.publish(event, (status, url) => {})
}

function validateInstruction(senderPubKey: string, instruction: string) {
    try {
        const parsed: IInstruction = JSON.parse(instruction)
        if (parsed.action) {
            if (parsed.action === EAction.createInvoice) {
                if (
                    !config.services
                        .find((s) => s.pubKey === senderPubKey)
                        ?.authorizations.includes(EAction.createInvoice)
                )
                    return false
                if (!parsed.createInvoice?.amount) return false
                return true
            } else if (parsed.action === EAction.payInvoice) {
                if (
                    !config.services.find((s) => s.pubKey === senderPubKey)?.authorizations.includes(EAction.payInvoice)
                )
                    return false
                if (parsed.payInvoice?.bolt11) return false
                return true
            } else {
                return false
            }
        }
        return false
    } catch (error) {
        return false
    }
}
