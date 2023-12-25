window.addEventListener('load', async function () {
  await navigator.serviceWorker.register('/coi-serviceworker.js')
})