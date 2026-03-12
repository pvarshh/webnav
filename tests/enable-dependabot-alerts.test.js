const { execSync, spawnSync } = require('child_process');

const hasDependabot = spawnSync('which', ['dependabot']).status === 0;
const describeOrSkip = hasDependabot ? describe : describe.skip;

describeOrSkip('Enable Dependabot Alerts', () => {
  it('should detect vulnerabilities when enabled', () => {
    const result = execSync('dependabot alerts').toString();
    expect(result).toContain('Vulnerabilities detected');
  });
});
