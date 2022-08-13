// Configuration for your app
// https://quasar.dev/quasar-cli/quasar-conf-js

module.exports = function (ctx) {
  return {
    // app boot file (/src/boot)
    // --> boot files are part of "main.js"
    // https://quasar.dev/quasar-cli/cli-documentation/boot-files
    boot: [
      'accounts',
      'computer',
      'notify-defaults',
      'i18n',
      'axios',
      'vuelidate',
      'vue-draggable-resizable'
    ],

    // https://quasar.dev/quasar-cli/quasar-conf-js#Property%3A-css
    css: [
      'app.scss'
    ],

    // https://github.com/quasarframework/quasar/tree/dev/extras
    extras: [
      // 'ionicons-v4',
      // 'mdi-v4',
      'fontawesome-v6',
      'line-awesome',
      // 'eva-icons',
      // 'themify',
      // 'roboto-font-latin-ext', // this or either 'roboto-font', NEVER both!

      // 'roboto-font', // optional, you are not bound to it
      'material-icons' // optional, you are not bound to it
    ],

    // https://quasar.dev/quasar-cli/quasar-conf-js#Property%3A-framework
    framework: {
      iconSet: 'material-icons', // Quasar icon set
      lang: 'en-us', // Quasar language pack

      // Possible values for "all":
      // * 'auto' - Auto-import needed Quasar components & directives
      //            (slightly higher compile time; next to minimum bundle size; most convenient)
      // * false  - Manually specify what to import
      //            (fastest compile time; minimum bundle size; most tedious)
      // * true   - Import everything from Quasar
      //            (not treeshaking Quasar; biggest bundle size; convenient)
      all: 'auto',

      components: ['QBtn'],
      directives: [],

      // Quasar plugins
      plugins: ['Notify']
    },

    // https://quasar.dev/quasar-cli/cli-documentation/supporting-ie
    supportIE: false,

    // Full list of options: https://quasar.dev/quasar-cli/quasar-conf-js#Property%3A-build
    build: {
      env: {
        MYVAR: '"myvar"'
      },
      vueCompiler: true, // Just because we want to use bBtn, bIcon ,etc (they have inline templates)
      scopeHoisting: true,
      vueRouterMode: 'hash', // available values: 'hash', 'history'
      showProgress: true,
      gzip: false,
      analyze: false,
      // Options below are automatically set depending on the env, set them if you want to override
      // preloadChunks: false,
      // extractCSS: false,

      // https://quasar.dev/quasar-cli/cli-documentation/handling-webpack
      extendWebpack (cfg) {
        cfg.module.rules.push({
          enforce: 'pre',
          test: /\.(js|vue)$/,
          loader: 'eslint-loader',
          exclude: /node_modules/,
          options: {
            formatter: require('eslint').CLIEngine.getFormatter('table')
          }
        })
      }
    },

    // Full list of options: https://quasar.dev/quasar-cli/quasar-conf-js#Property%3A-devServer
    devServer: {
      https: false,
      port: 8080,
      open: true, // opens browser window automatically
      proxy: {
        '/info': {
          target: 'http://10.1.1.4:3000',
          changeOrigin: true
        },
        '/check': {
          target: 'http://10.1.1.4:3000',
          changeOrigin: true
        },
        '/auth': {
          target: 'http://10.1.1.4:3000',
          changeOrigin: true
        },
        '/ws': {
          target: 'ws://10.1.1.4:8765',
          ws: true,
          changeOrigin: true
        }
      },
      headers: {
         "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"
      },
      watchOptions: {
        poll: 1000
      }
    },

    // animations: 'all', // --- includes all animations
    // https://quasar.dev/options/animations
    animations: [],

    // https://quasar.dev/quasar-cli/developing-ssr/configuring-ssr
    ssr: {
      pwa: false
    },

    // https://quasar.dev/quasar-cli/developing-pwa/configuring-pwa
    pwa: {
      workboxPluginMode: 'GenerateSW', // 'GenerateSW' or 'InjectManifest'
      workboxOptions: {}, // only for GenerateSW
      manifest: {
        name: 'bKit Client',
        short_name: 'bKit Client',
        description: 'A bKit Client App',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#fffffe',
        theme_color: '#027be3',
        icons: [
          {
            'src': 'statics/icons/icon-128x128.png',
            'sizes': '128x128',
            'type': 'image/png'
          },
          {
            'src': 'statics/icons/icon-192x192.png',
            'sizes': '192x192',
            'type': 'image/png'
          },
          {
            'src': 'statics/icons/icon-256x256.png',
            'sizes': '256x256',
            'type': 'image/png'
          },
          {
            'src': 'statics/icons/icon-384x384.png',
            'sizes': '384x384',
            'type': 'image/png'
          },
          {
            'src': 'statics/icons/icon-512x512.png',
            'sizes': '512x512',
            'type': 'image/png'
          }
        ]
      }
    },

    // Full list of options: https://quasar.dev/quasar-cli/developing-cordova-apps/configuring-cordova
    cordova: {
      // noIosLegacyBuildFlag: true, // uncomment only if you know what you are doing
      id: 'org.cordova.quasar.app'
    },


    // Full list of options: https://quasar.dev/quasar-cli/developing-capacitor-apps/configuring-capacitor
    capacitor: {
      hideSplashscreen: true
    },

    // Full list of options: https://quasar.dev/quasar-cli/developing-electron-apps/configuring-electron
    electron: {
      bundler: 'builder', // 'packager' or 'builder'

      packager: {
        // https://github.com/electron-userland/electron-packager/blob/master/docs/api.md#options

        // OS X / Mac App Store
        // appBundleId: '',
        // appCategoryType: '',
        // osxSign: '',
        // protocol: 'myapp://path',

        // Windows only
        // win32metadata: { ... }
      },

      builder: {
        // https://www.electron.build/configuration/configuration
        generateUpdatesFilesForAllChannels: true,
        appId: 'gui.bkit.pt',
        copyright: 'Copyright © 2020 ${author}',
        generateUpdatesFilesForAllChannels: true,
        publish: [
          {
            provider: 'github',
            releaseType: 'release'
          },
          {
            provider: 'generic',
            url: 'http://gui.bkit.pt/download/'
          }
        ],
        asar: {
        },
        extraFiles: [
          'bkit-client/**'
        ],
        productName: 'bKit',
        artifactName: '${productName}-${os}-${arch}-${version}.${ext}',
        nsis: {
          oneClick: false,
          allowElevation: true,
          // allowToChangeInstallationDirectory: true,
          perMachine: false,
          include: 'build/installer.nsh',
          runAfterFinish: true
        },
        nsisWeb : {
          appPackageUrl: 'https://github.com/jvverde/bKit-gui/releases/latest//download/',
          artifactName: 'Setup-${productName}-${os}-${arch}-${version}.${ext}'
        },
        win: {
          target: [
            {
              target: 'nsis',
              arch: [
                'x64',
                'ia32'
              ]
            }/*,
            {
              target: 'zip',
              arch: [
                'x64',
                'ia32'
              ]
            },
            {
              target: 'nsis-web',
              arch: [
                'x64',
                'ia32'
              ]
            },
            {
              target: 'msi',
              arch: [
                'x64',
                'ia32'
              ]
            }*/
          ]
        },
        linux: {
          category: 'Utility',
          target: [
            {
              target: 'appImage',
              arch: [
                'x64',
                'ia32'
              ]
            },
            {
              target: 'tar.gz',
              arch: [
                'x64',
                'ia32'
              ]
            },
            {
              target: 'rpm',
              arch: [
                'x64',
                'ia32'
              ]
            },
            {
              target: 'pacman',
              arch: [
                'x64',
                'ia32'
              ]
            },
            {
              target: 'deb',
              arch: [
                'x64',
                'ia32'
              ]
            }
          ]
        }
      },

      // More info: https://quasar.dev/quasar-cli/developing-electron-apps/node-integration
      nodeIntegration: true,

      extendWebpack (cfg) {
        // do something with Electron main process Webpack cfg
        // chainWebpack also available besides this extendWebpack
      }
    }
  }
}
