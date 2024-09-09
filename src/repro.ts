import { IdentityKeypair, isErr, Path, Peer, RuntimeDriverUniversal, ShareKeypair, Store } from "@earthstar/earthstar"
import {StorageDriverIndexedDB} from "@earthstar/earthstar/browser"

const password = 'password'
const defaultIdentityName = 'user'
const defaultShareName = 'documents'

const peer = new Peer({
  password,
  runtime: new RuntimeDriverUniversal(),
  storage: new StorageDriverIndexedDB()
})
let identity: IdentityKeypair | null = null
let share: ShareKeypair | null = null
let store: Store | null = null

// ? Initializes identity, share and store if they exist in localStorage otherwise they are created
async function initEarthstar() {
  const storage = window.localStorage

  const savedIdentity = storage.getItem('identity') ? JSON.parse(storage.getItem('identity')!) as IdentityKeypair : null
  if (savedIdentity) {
    await peer.addExistingIdentity(savedIdentity)
    identity = savedIdentity
  } else {
    const newIdentity = await peer.createIdentity(defaultIdentityName)
    if (isErr(newIdentity)) throw newIdentity
    storage.setItem('identity', JSON.stringify(newIdentity))
    identity = newIdentity
  }
  console.log('identity loaded', identity)

  const savedShare = storage.getItem('share') ? JSON.parse(storage.getItem('share')!) as ShareKeypair : null
  if (savedShare) {
    await peer.addExistingShare(savedShare)
    share = savedShare
  } else {
    const newShare = await peer.createShare(defaultShareName, false)
    if (isErr(newShare)) throw newShare
    await peer.mintCap(newShare.tag, identity.tag, 'read')
    const cap = await peer.mintCap(newShare.tag, identity.tag, 'write')
    if (isErr(cap)) throw cap
    console.log('minted cap', cap)

    storage.setItem('share', JSON.stringify(newShare))
    share = newShare
  }
  console.log('share loaded', share)

  const newStore = await peer.getStore(share.tag)
  if (isErr(newStore)) throw newStore
  store = newStore
  console.log('store loaded', store)
}

async function loadDocuments() {
  if (!share || !store) throw new Error('Earthstar has not been initialized')
  console.log('loadDocuments called')

  let loadedDocuments = 0
  for await (const doc of store.documents({ order: "path" })) {
    console.log('loaded doc:', doc);
    loadedDocuments++
  }

  const statsElement = document.getElementById('stats')
  if (statsElement) {
    statsElement.innerText = `loaded documents: ${loadedDocuments}`
  }
}

async function createDocument() {
  if (!share || !store || !identity) throw new Error('Earthstar has not been initialized')
  const randomName = window.crypto.randomUUID()
  const setEvent = await store.set({
    identity: identity.tag,
    path: Path.fromStrings(randomName),
    payload: new TextEncoder().encode('test')
  })
  console.log('new document created', setEvent)
}

export async function main() {
  await initEarthstar()
  await loadDocuments()

  const newButton = document.getElementById('new-document')
  newButton?.addEventListener('click', () => {
    console.log('button clicked')
    createDocument().then(() => {
      loadDocuments()
    })
  })
}
