const { execSync } = require('child_process');

describe('Enable Security Scanning', () => {
  it('should report issues when CodeQL analysis is performed', () => {
    const result = execSync('codeql database analyze').toString();
    expect(result).toContain('Issues found');
  });
});
