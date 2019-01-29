var API_LINK = location.protocol + '//' + location.host + '/api/'

new Docute({
  versions: {
    'v4 (Latest)': {
      link: '/'
    },
    v3: {
      link: 'https://v3--bili.netlify.com'
    }
  },
  sidebar: [
    {
      title: 'Guide',
      links: [
        {
          title: 'Installation',
          link: '/installation'
        },
        {
          title: 'Introduction',
          link: '/'
        },
        {
          title: 'Configuration File',
          link: '/configuration-file'
        },
        {
          title: 'Configuration',
          link: API_LINK + 'interfaces/config'
        }
      ]
    },
    {
      title: 'Recipes',
      links: [
        {
          title: 'JavaScript',
          link: '/recipes/javascript'
        },
        {
          title: 'CSS',
          link: '/recipes/css'
        },
        {
          title: 'Vue Component',
          link: '/recipes/vue-component'
        },
        {
          title: 'Update package.json',
          link: '/recipes/update-package-json'
        }
      ]
    },
    {
      title: 'Migration',
      links: [
        {
          title: 'v3 to v4',
          link: '/migration/v3-to-v4.md'
        }
      ]
    }
  ],
  nav: [
    {
      title: 'Home',
      link: '/'
    },
    {
      title: 'API',
      link: API_LINK
    },
    {
      title: 'GitHub',
      link: 'https://github.com/egoist/bili'
    },
    {
      title: 'Twitter',
      link: 'https://twitter.com/_egoistlily'
    }
  ],
  highlight: ['bash', 'typescript', 'json']
})
