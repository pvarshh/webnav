const axios = require('axios');

describe('Check 2FA for Collaborators', () => {
  it('should fail if any collaborators lack 2FA', async () => {
    const response = await axios.get(
      `https://api.github.com/orgs/${process.env.REPO_OWNER}/members`,
      { headers: { Authorization: `token ${process.env.GITHUB_TOKEN}` } }
    );
    const collaboratorsWithout2FA = response.data.filter(member => !member.two_factor_authentication);
    expect(collaboratorsWithout2FA.length).toBe(0);
  });
});
