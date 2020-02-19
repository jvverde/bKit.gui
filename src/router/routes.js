
const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('pages/HomePage.vue')
      },
      {
        path: 'restore',
        component: () => import('pages/restore/RestorePage.vue'),
        name: 'Restore'
      } /*,
      {
        path: 'recover/:path*',
        name: 'recover',
        props: true,
        component: import('pages/Recover.vue')
      } */
    ]
  }
]

// Always leave this as last one
if (process.env.MODE !== 'ssr') {
  routes.push({
    path: '*',
    component: () => import('pages/Error404.vue')
  })
}

export default routes
