export default {
  /*
   * Extract username from github image url
   * Needed to get usernames for github signups
   */
  getUsernameFromGithubURL(url) {
    const githubUrl = 'avatars.githubusercontent.com/';
    if (url && url.indexOf(githubUrl) !== -1) {
      const tokens = url.split(githubUrl);
      if (tokens.length === 2 && tokens[1] !== '') {
        return tokens[1];
      }
    }
    return null;
  },
};
