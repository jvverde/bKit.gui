export default async ({ store }) => {
  await Promise.all([
    store.dispatch('global/loadAccounts'),
    store.dispatch('global/loadCurrentAccount')
  ])
}
