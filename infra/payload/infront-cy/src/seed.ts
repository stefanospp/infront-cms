/**
 * Seed Payload CMS from Directus data.
 * Run: cd infra/payload/infront-cy && node --import tsx src/seed.ts
 */

const DIRECTUS_URL = 'https://cms.infront.cy'
const DIRECTUS_TOKEN = '0q1VZ-IcDVj1g6ifK4b5NpGVF5zcrfuH'
const PAYLOAD_URL = 'https://cms-infront.stepet.workers.dev'

async function getPayloadToken(): Promise<string> {
  // Use the first user's API key approach — login via REST
  const res = await fetch(`${PAYLOAD_URL}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'hello@infront.cy',
      password: process.env.PAYLOAD_PASSWORD || '',
    }),
  })
  const data = await res.json() as { token?: string; message?: string }
  if (!data.token) {
    throw new Error(`Login failed: ${JSON.stringify(data)}`)
  }
  return data.token
}

async function fetchDirectus(collection: string) {
  const res = await fetch(`${DIRECTUS_URL}/items/${collection}?limit=100&sort=id`, {
    headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` },
    signal: AbortSignal.timeout(10000),
  })
  const data = await res.json() as { data?: Record<string, unknown>[] }
  return data.data || []
}

async function createPayload(token: string, collection: string, item: Record<string, unknown>) {
  const res = await fetch(`${PAYLOAD_URL}/api/${collection}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `users API-Key ${token}`,
    },
    body: JSON.stringify(item),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err.slice(0, 300))
  }
  return res.json()
}

function cleanItem(item: Record<string, unknown>) {
  delete item.id
  delete item.date_created
  delete item.date_updated
  delete item.user_created
  delete item.user_updated
  delete item.sort
  return item
}

async function seed() {
  if (!process.env.PAYLOAD_PASSWORD) {
    console.error('Set PAYLOAD_PASSWORD env var: PAYLOAD_PASSWORD=yourpass node --import tsx src/seed.ts')
    process.exit(1)
  }

  console.log('Logging in to Payload...')
  const token = await getPayloadToken()
  console.log('Logged in.\n')

  // FAQ
  console.log('=== FAQ ===')
  const faq = await fetchDirectus('faq')
  for (const item of faq) {
    cleanItem(item)
    try {
      await createPayload(token, 'faq', item)
      console.log(`  Created: ${item.question}`)
    } catch (e: any) {
      console.log(`  FAILED: ${e.message?.slice(0, 150)}`)
    }
  }

  // Services
  console.log('\n=== Services ===')
  const services = await fetchDirectus('services')
  for (const item of services) {
    cleanItem(item)
    delete item.price_label
    delete item.payment_mode
    delete item.stripe_price_id
    try {
      await createPayload(token, 'services', item)
      console.log(`  Created: ${item.title}`)
    } catch (e: any) {
      console.log(`  FAILED: ${e.message?.slice(0, 150)}`)
    }
  }

  // Service Pages
  console.log('\n=== Service Pages ===')
  const servicePages = await fetchDirectus('service_pages')
  for (const item of servicePages) {
    cleanItem(item)
    item.hero_description = item.hero_subheading || ''
    delete item.hero_subheading
    try {
      await createPayload(token, 'service_pages', item)
      console.log(`  Created: ${item.title}`)
    } catch (e: any) {
      console.log(`  FAILED: ${e.message?.slice(0, 150)}`)
    }
  }

  // Articles
  console.log('\n=== Articles ===')
  const articles = await fetchDirectus('articles')
  for (const item of articles) {
    cleanItem(item)
    // Convert HTML content to simple text for now (richText needs Lexical format)
    // We'll store it as a simple text block
    if (item.content && typeof item.content === 'string') {
      delete item.content // Skip richText for now — add manually or via migration later
    }
    try {
      await createPayload(token, 'articles', item)
      console.log(`  Created: ${item.title}`)
    } catch (e: any) {
      console.log(`  FAILED: ${e.message?.slice(0, 150)}`)
    }
  }

  // Location Pages -> Industry Pages
  console.log('\n=== Industry Pages (from location_pages) ===')
  const locations = await fetchDirectus('location_pages')
  for (let i = 0; i < locations.length; i++) {
    const item = locations[i]
    const payload = {
      title: item.city as string,
      slug: item.slug as string,
      hero_heading: item.heading as string,
      hero_description: item.subheading as string || '',
      status: item.status as string || 'draft',
      display_order: i + 1,
    }
    try {
      await createPayload(token, 'industry_pages', payload)
      console.log(`  Created: ${payload.title}`)
    } catch (e: any) {
      console.log(`  FAILED: ${e.message?.slice(0, 150)}`)
    }
  }

  console.log('\nSeed complete!')
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
