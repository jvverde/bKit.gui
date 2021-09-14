export default async ({ store }) => {
  try {
    await Promise.all([
      store.dispatch('global/loadAccounts'),
      store.dispatch('global/loadCurrentAccount')
    ])
  } catch (err) {
    console.error('Load accounts error', err)
  }
}
