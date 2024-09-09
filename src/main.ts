import { main } from './repro.ts'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    Minimal repro example for earthstar

    <button id='new-document'>Create new document</button>
    <p id='stats'></p>
  </div>
`

main()
