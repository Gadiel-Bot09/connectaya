const apikey = 'b11539f9190aeb6bd5639f09028fa59a'
const url = 'https://evoapp.sinuhub.com'

async function run() {
  const res = await fetch(`${url}/chat/whatsappNumbers/prueba2`, {
    method: 'POST',
    headers: { apikey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ numbers: ['573012223333', '3012223333'] })
  })
  const d = await res.json()
  console.log(JSON.stringify(d, null, 2))
}
run().catch(console.error)
