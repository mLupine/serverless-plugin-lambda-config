<h1 align="center">Welcome to serverless-plugin-lambda-config 👋</h1>
<p>
  <a href="https://www.npmjs.com/package/serverless-plugin-lambda-config" target="_blank">
    <img alt="Version" src="https://img.shields.io/npm/v/serverless-plugin-lambda-config.svg">
  </a>
  <img src="https://img.shields.io/badge/node-%3E%3D14-blue.svg" />
  <a href="https://github.com/mLupine/serverless-plugin-lambda-config/blob/main/LICENSE" target="_blank">
    <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg" />
  </a>
  <a href="https://twitter.com/maciej" target="_blank">
    <img alt="Twitter: maciej" src="https://img.shields.io/twitter/follow/maciej.svg?style=social" />
  </a>
</p>

Serverless plugin that allows you to attach DLQs and configure invoke config on your AWS Lambda functions

### 🏠 [Homepage](https://github.com/mLupine/serverless-plugin-lambda-config)

## Prerequisites

- node >=14

## Install

```sh
yarn install
```

## Usage

Install using:
```sh
serverless plugin install --name serverless-plugin-lambda-config
```

Then configure in your `serverless.yml`. You can do it both globally:
```yaml
...
custom:
  lambdaConfig:
    # DLQ config for all lambda functions
    dlqArn: arn:aws:sqs:eu-west-1:000000000000:some-sqs-queue # you can use an SQS queue or an SNS topic arn
    # EventInvokeConfig config for all lambda functions
    invokeConfig:
      retryAttempts: 9
      maxEventAge: 999
```

or at a function level:
```yaml
...
functions:
  some_function:
      handler: src.handler.handle_function
      lambdaConfig:
        dlqArn: arn:aws:sqs:eu-west-1:000000000000:some-sqs-queue
        invokeConfig:
            retryAttempts: 9
            maxEventAge: 999
      events:
          - schedule: rate(2 minutes)
```

Specifying any of the top-level config parameters (`dlqArn` or `invokeConfig`) on a function overrides their global values.
## Author

👤 **Maciej Wilczyński**

* Website: https://lupin.pl
* Twitter: [@maciej](https://twitter.com/maciej)
* Github: [@mLupine](https://github.com/mLupine)

## 🤝 Contributing

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/mLupine/serverless-plugin-lambda-config/issues).

## Show your support

Give a ⭐️ if this project helped you!

## 📝 License

Copyright © 2021 [Maciej Wilczyński (maciej@lupine.software)](https://github.com/mLupine).<br />
This project is [MIT](https://github.com/mLupine/serverless-plugin-lambda-config/blob/main/LICENSE) licensed.

***
_This README was generated with ❤️ by [readme-md-generator](https://github.com/kefranabg/readme-md-generator)_
