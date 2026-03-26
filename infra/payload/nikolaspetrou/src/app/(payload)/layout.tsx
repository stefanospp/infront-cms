import type { ServerFunctionClient } from 'payload'
import { RootLayout } from '@payloadcms/next/layouts'
import configPromise from '@/payload.config'
import { importMap } from './admin/importMap'
import '@payloadcms/next/css'

type Args = { children: React.ReactNode }

const serverFunction: ServerFunctionClient = async function (args) {
  'use server'
  const { default: getPayload } = await import('payload')
  return args
}

const Layout = ({ children }: Args) => (
  <RootLayout config={configPromise} importMap={importMap}>
    {children}
  </RootLayout>
)

export default Layout
