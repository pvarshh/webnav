const { execSync } = require('child_process');

describe('Enable Dependabot Alerts', () => {
  it('should detect vulnerabilities when enabled', () => {
    const result = execSync('dependabot alerts').toString();
    expect(result).toContain('Vulnerabilities detected');
  });
});
