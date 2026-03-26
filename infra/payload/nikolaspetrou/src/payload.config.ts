import { buildConfig } from 'payload'
import { d1SQLiteAdapter } from '@payloadcms/db-d1-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { r2Storage } from '@payloadcms/storage-r2'
import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Projects } from './collections/Projects'
import { Services } from './collections/Services'
import { SiteSettings } from './globals/SiteSettings'

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || 'DEVELOPMENT-SECRET-CHANGE-ME',
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: ' — Nikolas Petrou CMS',
    },
  },
  collections: [Users, Media, Projects, Services],
  globals: [SiteSettings],
  editor: lexicalEditor(),
  db: d1SQLiteAdapter({
    client: async ({ env }: { env: Record<string, unknown> }) =>
      env.D1 as unknown as D1Database,
  }),
  plugins: [
    r2Storage({
      bucket: async ({ env }: { env: Record<string, unknown> }) =>
        env.R2 as unknown as R2Bucket,
      collections: {
        media: true,
      },
    }),
  ],
  typescript: {
    outputFile: 'src/payload-types.ts',
  },
})
