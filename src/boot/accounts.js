export default async ({ store }) => {
  try {
    await Promise.all([
      store.dispatch('accounts/loadAccounts'),
      store.dispatch('accounts/loadCurrentAccount')
    ])
  } catch (err) {
    console.error('Load accounts error', err)
  }
}
