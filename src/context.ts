import dotenv from 'dotenv'
import {octokit} from './octokit'
import {Options} from './options'
import {Prompts} from './prompts'
dotenv.config()
const context = {
  repo: {
    owner: process.env.owner!,
    repo: process.env.repo!
  },
  pullNumber: Number(process.env.pull_number!),
  targetRepo: {
    owner: process.env.target_owner!,
    repo: process.env.target_repo!,
    prMap: JSON.parse(process.env.pr_map!) as Record<number, number>
  },
  eventName: 'pull_request',
  payload: {
    // eslint-disable-next-line camelcase
    pull_request: {} as Awaited<
      ReturnType<typeof octokit.rest.pulls.get>
    >['data']
  }
}

export async function getContext(): Promise<typeof context> {
  if (context.payload.pull_request.number) return context
  const pr = await octokit.rest.pulls.get({
    owner: context.repo.owner,
    repo: context.repo.repo,
    // eslint-disable-next-line camelcase
    pull_number: context.pullNumber
  })
  // eslint-disable-next-line camelcase
  context.payload.pull_request = pr.data
  return context
}

export function getOptions(): Options {
  const options: Options = new Options(
    process.env.debug === 'true' ?? false,
    process.env.disable_review === 'true' ?? false,
    process.env.disable_release_notes === 'true' ?? false,
    process.env.max_files ?? '150',
    process.env.review_simple_changes === 'true' ?? false,
    process.env.review_comment_lgtm === 'true' ?? false,
    process.env.path_filters
      ? process.env.path_filters.split('\n')
      : [
          '!dist/**',
          '!**/*.app',
          '!**/*.bin',
          '!**/*.bz2',
          '!**/*.class',
          '!**/*.db',
          '!**/*.csv',
          '!**/*.tsv',
          '!**/*.dat',
          '!**/*.dll',
          '!**/*.dylib',
          '!**/*.egg',
          '!**/*.glif',
          '!**/*.gz',
          '!**/*.xz',
          '!**/*.zip',
          '!**/*.7z',
          '!**/*.rar',
          '!**/*.zst',
          '!**/*.ico',
          '!**/*.jar',
          '!**/*.tar',
          '!**/*.war',
          '!**/*.lo',
          '!**/*.log',
          '!**/*.mp3',
          '!**/*.wav',
          '!**/*.wma',
          '!**/*.mp4',
          '!**/*.avi',
          '!**/*.mkv',
          '!**/*.wmv',
          '!**/*.m4a',
          '!**/*.m4v',
          '!**/*.3gp',
          '!**/*.3g2',
          '!**/*.rm',
          '!**/*.mov',
          '!**/*.flv',
          '!**/*.iso',
          '!**/*.swf',
          '!**/*.flac',
          '!**/*.nar',
          '!**/*.o',
          '!**/*.ogg',
          '!**/*.otf',
          '!**/*.p',
          '!**/*.pdf',
          '!**/*.doc',
          '!**/*.docx',
          '!**/*.xls',
          '!**/*.xlsx',
          '!**/*.ppt',
          '!**/*.pptx',
          '!**/*.pkl',
          '!**/*.pickle',
          '!**/*.pyc',
          '!**/*.pyd',
          '!**/*.pyo',
          '!**/*.pub',
          '!**/*.pem',
          '!**/*.rkt',
          '!**/*.so',
          '!**/*.ss',
          '!**/*.eot',
          '!**/*.exe',
          '!**/*.pb.go',
          '!**/*.lock',
          '!**/*.ttf',
          '!**/*.yaml',
          '!**/*.yml',
          '!**/*.cfg',
          '!**/*.toml',
          '!**/*.ini',
          '!**/*.mod',
          '!**/*.sum',
          '!**/*.work',
          '!**/*.json',
          '!**/*.mmd',
          '!**/*.svg',
          '!**/*.jpeg',
          '!**/*.jpg',
          '!**/*.png',
          '!**/*.gif',
          '!**/*.bmp',
          '!**/*.tiff',
          '!**/*.webm',
          '!**/*.woff',
          '!**/*.woff2',
          '!**/*.dot',
          '!**/*.md5sum',
          '!**/*.wasm',
          '!**/*.snap',
          '!**/*.parquet',
          '!**/gen/**',
          '!**/_gen/**',
          '!**/generated/**',
          '!**/@generated/**',
          '!**/vendor/**',
          '!**/*.min.js',
          '!**/*.min.js.map',
          '!**/*.min.js.css',
          '!**/*.tfstate',
          '!**/*.tfstate.backup'
        ],
    process.env.system_message ??
      `You are \`@coderabbitai\` (aka \`github-actions[bot]\`), a language model 
trained by OpenAI. Your purpose is to act as a highly experienced 
software engineer and provide a thorough review of the code hunks
and suggest code snippets to improve key areas such as:
  - Logic
  - Security
  - Performance
  - Data races
  - Consistency
  - Error handling
  - Maintainability
  - Modularity
  - Complexity
  - Optimization
  - Best practices: DRY, SOLID, KISS

Do not comment on minor code style issues, missing 
comments/documentation. Identify and resolve significant 
concerns to improve overall code quality while deliberately 
disregarding minor issues.
`,
    process.env.openai_light_model ?? 'gpt-3.5-turbo-16k',
    process.env.openai_heavy_model ?? 'gpt-3.5-turbo-16k',
    process.env.openai_model_temperature ?? '0.05',
    process.env.openai_retries ?? '5',
    process.env.openai_timeout_ms ?? '360000',
    process.env.openai_concurrency_limit ?? '6',
    process.env.github_concurrency_limit ?? '6',
    process.env.openai_base_url ?? 'https://api.openai.com/v1',
    process.env.language ?? 'en-US'
  )
  return options
}

export function getPrompts(): Prompts {
  return new Prompts(
    process.env.summarize ??
      `Provide your final response in the \`markdown\` format with 
the following content:
  - *Walkthrough*: A high-level summary of the  
    overall change instead of specific files within 80 words.
  - *Changes*: A table of files and their summaries. You can group 
    files with similar changes together into a single row to conserve
    space.

Avoid additional commentary as this summary will be added as a 
comment on the GitHub pull request.
`,
    process.env.summarize_release_notes ??
      `Create concise release notes in \`markdown\` format for this pull request, 
focusing on its purpose and user story. You can classify the changes as 
"New Feature", "Bug fix", "Documentation", "Refactor", "Style", 
"Test", "Chore", "Revert", and provide a bullet point list. For example: 
"New Feature: An integrations page was added to the UI". Keep your 
response within 50-100 words. Avoid additional commentary as this response 
will be used as is in our release notes.

Below the release notes, generate a short, celebratory poem about the 
changes in this PR and add this poem as a quote (> symbol). You can 
use emojis in the poem, where they are relevant.
`
  )
}
