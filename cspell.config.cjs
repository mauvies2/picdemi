const vscodeConfig = require('./.vscode/settings.json');

module.exports = {
  ignorePaths: [
    'node_modules',
    'public',
    'build',
    '.next',
    'tsconfig.tsbuildinfo',
    'biome.json',
    '*.erd.json',
    'next.config.ts',
    '.gitignore',
    'pnpm-lock.yaml',
    'extensions.json',
    'next.config.ts',
    '*.ts.snap',
  ],
  words: vscodeConfig['cSpell.words'],
};
