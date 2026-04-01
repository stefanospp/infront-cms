import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'
import { sqliteD1Adapter } from '@payloadcms/db-d1-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { r2Storage } from '@payloadcms/storage-r2'
import type { CloudflareContext } from '@opennextjs/cloudflare'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import type { GetPlatformProxyOptions } from 'wrangler'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { FAQ } from './collections/FAQ'
import { Testimonials } from './collections/Testimonials'
import { Services } from './collections/Services'
import { ServicePages } from './collections/ServicePages'
import { Articles } from './collections/Articles'
import { Portfolio } from './collections/Portfolio'
import { IndustryPages } from './collections/IndustryPages'
import { Submissions } from './collections/Submissions'
import { Audits } from './collections/Audits'
import { SiteSettings } from './globals/SiteSettings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const realpath = (value: string) => {
  try {
    return fs.existsSync(value) ? fs.realpathSync(value) : undefined
  } catch {
    return undefined
  }
}

const isCLI = process.argv.some(
  (value) => realpath(value)?.endsWith(path.join('payload', 'bin.js')),
)
const isProduction = process.env.NODE_ENV === 'production'

const createLog =
  (level: string, fn: typeof console.log) => (objOrMsg: object | string, msg?: string) => {
    if (typeof objOrMsg === 'string') {
      fn(JSON.stringify({ level, msg: objOrMsg }))
    } else {
      fn(JSON.stringify({ level, ...objOrMsg, msg: msg ?? (objOrMsg as { msg?: string }).msg }))
    }
  }

const cloudflareLogger = {
  level: process.env.PAYLOAD_LOG_LEVEL || 'info',
  trace: createLog('trace', console.debug),
  debug: createLog('debug', console.debug),
  info: createLog('info', console.log),
  warn: createLog('warn', console.warn),
  error: createLog('error', console.error),
  fatal: createLog('fatal', console.error),
  silent: () => {},
} as any

const cloudflare =
  isCLI || !isProduction
    ? await getCloudflareContextFromWrangler()
    : await getCloudflareContext({ async: true })

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || 'DEVELOPMENT-SECRET-CHANGE-ME',
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' — infront.cy CMS',
    },
    livePreview: {
      url: ({ data, collectionConfig }) => {
        const base = process.env.SITE_URL || 'http://localhost:4330/preview'
        const token = process.env.PREVIEW_SECRET || 'infront-preview-secret'
        if (collectionConfig?.slug === 'service_pages' && data?.slug) {
          return `${base}/services/${data.slug}?token=${token}`
        }
        if (collectionConfig?.slug === 'articles' && data?.slug) {
          return `${base}/blog/${data.slug}?token=${token}`
        }
        if (collectionConfig?.slug === 'portfolio' && data?.slug) {
          return `${base}/portfolio/${data.slug}?token=${token}`
        }
        if (collectionConfig?.slug === 'industry_pages' && data?.slug) {
          return `${base}/who-we-help/${data.slug}?token=${token}`
        }
        return `${base}?token=${token}`
      },
      collections: ['service_pages', 'articles', 'portfolio', 'industry_pages'],
      globals: ['site-settings'],
    },
  },
  collections: [Users, Media, FAQ, Testimonials, Services, ServicePages, Articles, Portfolio, IndustryPages, Submissions, Audits],
  globals: [SiteSettings],
  editor: lexicalEditor(),
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteD1Adapter({ binding: cloudflare.env.D1 }),
  logger: isProduction ? cloudflareLogger : undefined,
  plugins: [
    r2Storage({
      bucket: cloudflare.env.R2,
      collections: { media: true },
    }),
  ],
})

function getCloudflareContextFromWrangler(): Promise<CloudflareContext> {
  return import(/* webpackIgnore: true */ `${'__wrangler'.replaceAll('_', '')}`).then(
    ({ getPlatformProxy }) =>
      getPlatformProxy({
        environment: process.env.CLOUDFLARE_ENV,
        remoteBindings: isProduction,
      } satisfies GetPlatformProxyOptions),
  )
}
