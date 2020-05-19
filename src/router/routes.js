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
      // {
      //   path: 'restore',
      //   component: () => import('pages/restore/RestorePage.vue'),
      //   name: 'Restore'
      // },
      {
        path: 'backup',
        component: () => import('pages/backup/BackupPage.vue'),
        name: 'backup',
        beforeEnter: (to, from, next) => {
          if (server()) {
            next()
          } else {
            next({ name: 'servers' })
          }
        }
      },
      {
        path: 'servers',
        component: () => import('pages/Servers.vue'),
        name: 'servers'
      },
      {
        path: 'tasks',
        component: () => import('pages/tasks/TasksPage.vue'),
        name: 'tasks'
      },
      {
        path: 'update',
        component: () => import('pages/Update.vue'),
        name: 'update'
      },
      {
        path: 'customize',
        component: () => import('pages/Customize.vue'),
        name: 'customize'
      }
      /*,
      {
        path: 'recover/:path*',
        name: 'recover',
        props: true,
        component: import('pages/Recover.vue')
      }
      */
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
