// import { getServer, getUser } from 'src/helpers/bkit'
import { Store } from 'src/store'

const account = () => Store.getters['global/account']

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
          if (account()) { // Currently this do nothins as accounts always returns an object
            next()
          } else {
            next({ name: 'servers', params: { back: 'backup' } })
          }
        }
      },
      {
      // This almost duplicated route is a workaround to deal with push named route
        path: 'login/:user?',
        name: 'login',
        props: true,
        component: () => import('pages/Signin.vue')
      },
      {
        path: 'servers',
        component: () => import('pages/servers/'),
        name: 'servers',
        props: true,
        children: [
          {
            path: 'new/server',
            name: 'NewServer',
            component: () => import('pages/servers/NewServer.vue')
          },
          {
            path: ':server/accounts',
            name: 'ListAccounts',
            props: true,
            component: () => import('pages/servers/ListAccounts.vue'),
            children: [
              {
                path: 'show/:user',
                name: 'Account',
                props: true,
                component: () => import('components/Server/Account.vue')
              },
              {
                path: 'new',
                name: 'NewAccount',
                props: true,
                component: () => import('components/Server/NewAccount.vue'),
                children: [
                  {
                    path: 'signup',
                    name: 'signup',
                    props: true,
                    component: () => import('components/Auth/Signup.vue')
                  },
                  {
                    path: 'signin',
                    name: 'signin',
                    props: true,
                    component: () => import('pages/Signin.vue')
                  }
                ]
              },
              {
                path: 'resetpass',
                name: 'ResetPass',
                props: true,
                component: () => import('components/Auth/Reset.vue')
              }
            ]
          },
          {
            path: '*',
            component: () => import('components/Empty.vue')
          }
        ]
      },
      {
        path: 'tasks',
        component: () => import('pages/tasks/TasksPage.vue'),
        name: 'tasks'
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
