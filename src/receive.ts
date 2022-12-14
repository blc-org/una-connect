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
    id: string | null
    action: EAction

    createInvoice: {
        amount: number | null
        amountMsats: number | null
        description: string | null
        descriptionHash: string | null
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
            await createInvoice(parsed.id, event.pubkey, {
                amount: parsed.createInvoice.amount,
                amountMsats: parsed.createInvoice.amountMsats,
                description: parsed.createInvoice.description,
                descriptionHash: parsed.createInvoice.descriptionHash,
            })
        } else if (parsed.action === EAction.payInvoice) {
            await payInvoice(event.pubkey, { bolt11: parsed.payInvoice.bolt11 })
        }
    } else {
        console.log(`Cannot validate instruction for event ${event.id}. Skip.`)
    }
    await updateFinishedEvents(event.id)
}

async function createInvoice(
    id: string | null,
    receiverPubKey: string,
    { amount, amountMsats, description, descriptionHash }: { amount: number | null; amountMsats: number | null; description: string | null; descriptionHash: string | null },
) {
    try {
        // @ts-ignore
        const invoice = await unaWrapper.createInvoice({ amount, amountMsats, description, descriptionHash })
        await sendResult(receiverPubKey, id ? { id, ...invoice } : invoice)
    } catch (error) {
        console.error({ error })
    }
}

async function payInvoice(receiverPubKey: string, { bolt11 }: { bolt11: string }) {
    try {
        // @ts-ignore
        const invoice = await unaWrapper.payInvoice({ bolt11 })
        await sendResult(receiverPubKey, invoice)
    } catch (error) {
        console.error({ error })
    }
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
                if (!parsed.createInvoice?.amount && !parsed.createInvoice?.amountMsats) return false
                return true
            } else if (parsed.action === EAction.payInvoice) {
                if (
                    !config.services.find((s) => s.pubKey === senderPubKey)?.authorizations.includes(EAction.payInvoice)
                )
                    return false
                if (!parsed.payInvoice?.bolt11) return false
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
