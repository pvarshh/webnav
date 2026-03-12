const { execSync, spawnSync } = require('child_process');

const hasCodeQL = spawnSync('which', ['codeql']).status === 0;
const describeOrSkip = hasCodeQL ? describe : describe.skip;

describeOrSkip('Enable Security Scanning', () => {
  it('should report issues when CodeQL analysis is performed', () => {
    const result = execSync('codeql database analyze').toString();
    expect(result).toContain('Issues found');
  });
});
