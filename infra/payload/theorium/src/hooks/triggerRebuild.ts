import type { CollectionAfterChangeHook, GlobalAfterChangeHook } from 'payload'

const triggerRebuild = async () => {
  const token = process.env.GH_DEPLOY_PAT
  const repo = process.env.GH_REPO
  if (!token || !repo) return
  try {
    await fetch(`https://api.github.com/repos/${repo}/dispatches`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        event_type: 'cms-publish',
        client_payload: { slug: 'theorium-v2' },
      }),
    })
  } catch {
    // Silent fail — don't block CMS saves if rebuild trigger fails
  }
}

export const collectionRebuildHook: CollectionAfterChangeHook = async () => {
  await triggerRebuild()
}

export const globalRebuildHook: GlobalAfterChangeHook = async () => {
  await triggerRebuild()
}
