"use strict";
const _ = require("lodash");

class LambdaConfigPlugin {
	constructor(serverless, options, v3Obj) {
		this.serverless = serverless;

		if (v3Obj && v3Obj.log) {
			this.log = v3Obj.log;
		} else {
			const log = serverless.cli.log;
			this.log = {
				error: log,
				warning: log,
				notice: log,
				info: log,
				debug: log
			};
		}

		if (this.serverless.service.provider.name !== "aws") {
			this.throwError("This plugin supports only AWS");
		}

		const configSchema = {
			type: "object",
			properties: {
				lambdaConfig: {
					type: "object",
					properties: {
						dlqArn: { $ref: "#/definitions/awsArn" },
						invokeConfig: {
							type: "object",
							properties: {
								retryAttempts: { type: "integer" },
								maxEventAge: { type: "integer" },
							},
							required: [],
						}
					},
					required: [],
				},
			},
			required: [],
		};
		serverless.configSchemaHandler.defineCustomProperties(configSchema);
		serverless.configSchemaHandler.defineFunctionProperties("aws", configSchema);

		this.hooks = {
			"initialize": () => {
			},
			"before:package:finalize": this.attachConfigToCFN.bind(this)
		};
	}

	attachConfigToCFN() {
		const rscs = this.serverless.service.provider.compiledCloudFormationTemplate.Resources;
		const config = this.serverless.configurationInput;

		const globalPluginConfig = config.custom ? config.custom.lambdaConfig : null;
		let globalDLQArn = null;
		let globalInvokeConfig = {};
		if (globalPluginConfig) {
			if (globalPluginConfig.dlqArn) {
				globalDLQArn = globalPluginConfig.dlqArn;
			}

			if (!globalDLQArn.startsWith("arn:aws:sqs:") && !globalDLQArn.startsWith("arn:aws:sns:")) {
				this.throwError("lambdaConfig.dlqArn must be an SQS queue or SNS topic ARN");
				return;
			}

			if (globalPluginConfig.invokeConfig) {
				globalInvokeConfig = globalPluginConfig.invokeConfig;
			}
		}

		for (const funcName of this.serverless.service.getAllFunctions()) {
			const func = this.serverless.service.getFunction(funcName);
			const funcNameNormalized = this.serverless.providers.aws.naming.getNormalizedFunctionName(funcName);
			const resName = funcNameNormalized + "LambdaFunction";

			const functionPluginConfig = func["lambdaConfig"];

			let targetDLQArn = globalDLQArn;
			let targetInvokeConfig = globalInvokeConfig;
			if (functionPluginConfig) {
				if (globalDLQArn && functionPluginConfig.dlqArn !== undefined && !functionPluginConfig.dlqArn) {
					targetDLQArn = null;
				} else if (
					functionPluginConfig.dlqArn
					&& !functionPluginConfig.dlqArn.startsWith("arn:aws:sqs:")
					&& !functionPluginConfig.dlqArn.startsWith("arn:aws:sns:")
				) {
					this.throwError(`${funcName}: lambdaConfig.dlqArn must be an SQS queue or SNS topic ARN`);
				} else if (functionPluginConfig.dlqArn) {
					targetDLQArn = functionPluginConfig.dlqArn;
				}

				const functionInvokeConfig = functionPluginConfig.invokeConfig || {};
				if (functionInvokeConfig !== undefined) {
					if (
						globalInvokeConfig.retryAttempts !== undefined
						&& functionInvokeConfig.retryAttempts === undefined
					) {
						targetInvokeConfig.retryAttempts = null;
					}
					if (
						globalInvokeConfig.maxEventAge !== undefined
						&& functionInvokeConfig.maxEventAge === undefined
					) {
						targetInvokeConfig.maxEventAge = null;
					}
					if (functionInvokeConfig.retryAttempts !== undefined ) {
						targetInvokeConfig.retryAttempts = functionInvokeConfig.retryAttempts;
					}
					if (functionInvokeConfig.maxEventAge !== undefined ) {
						targetInvokeConfig.maxEventAge = functionInvokeConfig.maxEventAge;
					}
				}
			}

			if (targetDLQArn) {
				this.log.info(`Attaching DLQ ${targetDLQArn} to function ${funcName}`);
				rscs[resName].Properties.DeadLetterConfig = {
					TargetArn: targetDLQArn
				};
			}

			if (targetInvokeConfig && (targetInvokeConfig.retryAttempts || targetInvokeConfig.maxEventAge)) {
				const invokeConfigResName = funcNameNormalized + "EventInvokeConfig";

				this.log.info(`Setting invoke config for function ${funcName}`);
				rscs[invokeConfigResName] = {
					Type: "AWS::Lambda::EventInvokeConfig",
					Properties: {
						FunctionName: func.name,
						MaximumEventAgeInSeconds: targetInvokeConfig.maxEventAge || undefined,
						MaximumRetryAttempts: targetInvokeConfig.retryAttempts || undefined,
						Qualifier: "$LATEST",
					},
					DependsOn: [resName],
				};
			}
		}
	}

	throwError(msg, ...args) {
		if (!_.isEmpty(args)) {
			msg = msg + " " + args.join(" ");
		}
		const errMsg = `ERROR: ${msg}`;
		throw new this.serverless.classes.Error(errMsg);
	}
}

module.exports = LambdaConfigPlugin;
