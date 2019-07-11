<<<<<<< HEAD
Display the list of repositories 
=======
Display the list of repositories

>>>>>>> fix(collective): fix twitter card
```js
const repositories = [
  {
    description: 'Adblock Plus browser extension',
    fork: true,
    full_name: 'flickz/adblockpluschrome',
    name: 'adblockpluschrome',
    owner: { login: 'flickz', type: 'Organization' },
    stargazers_count: 113,
  },
  {
    description:
      'A new form of association, transparent by design. Please report issues there. Feature requests and ideas welcome!',
    fork: true,
    full_name: 'flickz/jobtweets',
    name: 'JobTweets',
    owner: { login: 'flickz', type: 'User' },
    stargazers_count: 103,
<<<<<<< HEAD
  }
=======
  },
>>>>>>> fix(collective): fix twitter card
];

<GithubRepositories
  repositories={repositories}
  onCreateCollective={data => {
<<<<<<< HEAD
    console.log(data)
  }}
  />
```
=======
    console.log(data);
  }}
/>;
```
>>>>>>> fix(collective): fix twitter card
