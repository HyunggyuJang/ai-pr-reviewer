import {error, warn} from 'console'
import {Bot} from './bot'
import {OpenAIOptions, Options} from './options'
import {Prompts} from './prompts'
import {codeReview} from './review'
import {handleReviewComment} from './review-comment'
import {getOptions, getPrompts} from './context'

async function run(): Promise<void> {
  const options: Options = getOptions()

  // print options
  options.print()

  const prompts: Prompts = getPrompts()

  // Create two bots, one for summary and one for review

  let lightBot: Bot | null = null
  try {
    lightBot = new Bot(
      options,
      new OpenAIOptions(options.openaiLightModel, options.lightTokenLimits)
    )
  } catch (e: any) {
    warn(
      `Skipped: failed to create summary bot, please check your openai_api_key: ${e}, backtrace: ${e.stack}`
    )
    return
  }

  let heavyBot: Bot | null = null
  try {
    heavyBot = new Bot(
      options,
      new OpenAIOptions(options.openaiHeavyModel, options.heavyTokenLimits)
    )
  } catch (e: any) {
    warn(
      `Skipped: failed to create review bot, please check your openai_api_key: ${e}, backtrace: ${e.stack}`
    )
    return
  }

  try {
    // check if the event is pull_request
    if (
      process.env.GITHUB_EVENT_NAME === 'pull_request' ||
      process.env.GITHUB_EVENT_NAME === 'pull_request_target'
    ) {
      await codeReview(lightBot, heavyBot, options, prompts)
    } else if (
      process.env.GITHUB_EVENT_NAME === 'pull_request_review_comment'
    ) {
      await handleReviewComment(heavyBot, options, prompts)
    } else {
      warn('Skipped: this action only works on push events or pull_request')
    }
  } catch (e: any) {
    if (e instanceof Error) {
      error(`Failed to run: ${e.message}, backtrace: ${e.stack}`)
    } else {
      error(`Failed to run: ${e}, backtrace: ${e.stack}`)
    }
  }
}

process
  .on('unhandledRejection', (reason, p) => {
    warn(`Unhandled Rejection at Promise: ${reason}, promise is ${p}`)
  })
  .on('uncaughtException', (e: any) => {
    warn(`Uncaught Exception thrown: ${e}, backtrace: ${e.stack}`)
  })

await run()
