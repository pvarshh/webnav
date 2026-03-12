const axios = require('axios');

const hasEnv = process.env.GITHUB_TOKEN && process.env.REPO_OWNER && process.env.REPO_NAME;
const describeOrSkip = hasEnv ? describe : describe.skip;

describeOrSkip('Verify Branch Protection Rules', () => {
  it('should ensure branch protection rules are configured', async () => {
    const response = await axios.get(
      `https://api.github.com/repos/${process.env.REPO_OWNER}/${process.env.REPO_NAME}/branches/main/protection`,
      { headers: { Authorization: `token ${process.env.GITHUB_TOKEN}` } }
    );
    expect(response.status).toBe(200);
    expect(response.data.required_status_checks).toBeDefined();
  });
});
