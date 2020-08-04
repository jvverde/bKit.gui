// import { getServer, getUser } from 'src/helpers/bkit'
import { Store } from 'src/store'

const server = () => Store.getters['global/server']

const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('pages/HomePage.vue'),
        name: 'home'
      },
      {
        path: 'backup',
        component: () => import('pages/backup/BackupPage.vue'),
        name: 'backup',
        beforeEnter: (to, from, next) => {
          if (server()) {
            next()
          } else {
            next({ name: 'servers', params: { back: 'backup' } })
          }
        }
      },
      {
        path: 'servers/:back?',
        component: () => import('pages/Servers.vue'),
        name: 'servers',
        props: true,
        children: [
          {
            path: '',
            component: () => import('components/Empty.vue')
          },
          {
            path: 'server/:address',
            props: true,
            component: () => import('components/Auth/Signup.vue')
          }
        ]
      },
      {
        path: 'tasks',
        component: () => import('pages/tasks/TasksPage.vue'),
        name: 'tasks'
      },
      {
        path: 'Signup',
        component: () => import('components/Auth/Signup.vue'),
        name: 'signup'
      },
      {
        path: 'customize',
        component: () => import('pages/Customize.vue'),
        name: 'customize'
      }
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
