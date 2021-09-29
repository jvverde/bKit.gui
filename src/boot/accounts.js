export default async ({ store }) => {
  try {
    await store.dispatch('accounts/loadAccounts')
    await store.dispatch('accounts/loadCredentials')
    await store.dispatch('accounts/loadCurrentAccount')
  } catch (err) {
    console.error('Load accounts error', err)
  }
}
