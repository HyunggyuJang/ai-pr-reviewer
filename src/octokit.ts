import {warn} from 'console'
import {Octokit} from '@octokit/core'
import {retry} from '@octokit/plugin-retry'
import {restEndpointMethods} from '@octokit/plugin-rest-endpoint-methods'
import {throttling} from '@octokit/plugin-throttling'
import dotenv from 'dotenv'

dotenv.config()
const token = process.env.GITHUB_TOKEN

const RetryAndThrottlingOctokit = Octokit.plugin(
  throttling,
  retry,
  restEndpointMethods
)

export const octokit = new RetryAndThrottlingOctokit({
  auth: token,
  throttle: {
    onRateLimit: (
      retryAfter: number,
      options: any,
      _o: any,
      retryCount: number
    ) => {
      warn(
        `Request quota exhausted for request ${options.method} ${options.url}
Retry after: ${retryAfter} seconds
Retry count: ${retryCount}
`
      )
      if (retryCount <= 3) {
        warn(`Retrying after ${retryAfter} seconds!`)
        return true
      }
    },
    onSecondaryRateLimit: (retryAfter: number, options: any) => {
      warn(
        `SecondaryRateLimit detected for request ${options.method} ${options.url} ; retry after ${retryAfter} seconds`
      )
      // if we are doing a POST method on /repos/{owner}/{repo}/pulls/{pull_number}/reviews then we shouldn't retry
      if (
        options.method === 'POST' &&
        options.url.match(/\/repos\/.*\/.*\/pulls\/.*\/reviews/)
      ) {
        return false
      }
      return true
    }
  }
})
const {
  data: {login}
} = await octokit.rest.users.getAuthenticated()
// eslint-disable-next-line no-console
console.log('Hello, %s', login)
