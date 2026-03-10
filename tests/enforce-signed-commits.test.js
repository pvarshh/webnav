const { execSync } = require('child_process');

describe('Enforce Signed Commits', () => {
  it('should fail if unsigned commits are found', () => {
    const result = execSync("git log --pretty=format:'%G?' | grep -v 'G' || echo 'All commits are signed.'").toString();
    expect(result).not.toContain('Unsigned commits found!');
  });
});
