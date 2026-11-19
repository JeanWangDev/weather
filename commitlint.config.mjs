/**
 * Commit message 規範：Conventional Commits
 * 格式：<type>(<scope>): <subject>
 *
 *   feat     新功能            fix      修復缺陷
 *   refactor 重構（無行為變化）  style    格式（不影響邏輯）
 *   perf     效能優化           test     測試
 *   docs     文檔               build    建置／依賴
 *   ci       CI 設定            chore    雜項
 *
 * 為什麼要卡這一層：commit 歷史是評審閱讀「思考過程」的第一入口，
 * 統一格式後用 `git log --oneline` 就能看出功能演進脈絡。
 */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'refactor',
        'style',
        'perf',
        'test',
        'docs',
        'build',
        'ci',
        'chore',
        'revert',
      ],
    ],
    'subject-case': [0],
    'subject-max-length': [2, 'always', 72],
    'header-max-length': [2, 'always', 100],
    'body-max-line-length': [0],
  },
};
