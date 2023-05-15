//import * as apigw from "aws-cdk-lib/aws-apigatewayv2";
import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";

import { HttpApi, HttpMethod } from "@aws-cdk/aws-apigatewayv2-alpha";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";

import { BillingMode, TableClass } from "aws-cdk-lib/aws-dynamodb";
import { RemovalPolicy } from "aws-cdk-lib";

import { Construct } from "constructs";
import { Duration } from "aws-cdk-lib";
import { Stack } from "aws-cdk-lib";
import { RustFunction } from "cargo-lambda-cdk";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";

export class BlogArticleStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const itemsTable = new dynamodb.Table(this, "Items", {
      tableName: `${Stack.of(this).stackName}-Items`,
      partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
      tableClass: TableClass.STANDARD_INFREQUENT_ACCESS,
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const jsConfig = {
      environment: {
        DEBUG: "false",
      },
      runtime: Runtime.NODEJS_18_X,
      timeout: Duration.seconds(10),
    };

    const tsHelloWorldFn = new NodejsFunction(this, "helloworld", {
      ...jsConfig,
      description: "Hello World / Typescript",
    });

    const tsDynamodbFn = new NodejsFunction(this, "dynamodb", {
      ...jsConfig,
      environment: {
        ...jsConfig.environment,
        TABLE_NAME: itemsTable.tableName,
      },
      description: "DynamoDB / Typescript",
    });

    const tsFibonacciFn = new NodejsFunction(this, "fibonacci", {
      ...jsConfig,
      description: "Fibonacci / Typescript",
    });

    const rustHelloWorldFn = new RustFunction(this, "helloworld-rs", {
      manifestPath: "helloworld/Cargo.toml",
      description: "Hello World / Rust",
    });

    const rustDynamodbFn = new RustFunction(this, "dynamodb-rs", {
      manifestPath: "dynamodb/Cargo.toml",
      environment: {
        TABLE_NAME: itemsTable.tableName,
      },
      description: "DynamoDB / Rust",
    });

    const rustFibonacciFn = new RustFunction(this, "fibonacci-rs", {
      manifestPath: "fibonacci/Cargo.toml",
      description: "Fibonacci / Rust",
    });

    itemsTable.grantReadWriteData(tsDynamodbFn);
    itemsTable.grantReadWriteData(rustDynamodbFn);

    // Integrations
    const rustHelloWorldIntegration = new HttpLambdaIntegration(
      "Rust Hello World",
      rustHelloWorldFn
    );
    const rustFibonacciIntegration = new HttpLambdaIntegration(
      "Rust Fibonacci",
      rustFibonacciFn
    );
    const rustDynamodbIntegration = new HttpLambdaIntegration(
      "Rust DynamoDB",
      rustDynamodbFn
    );
    const tsHelloWorldIntegration = new HttpLambdaIntegration(
      "Typescript Hello World",
      tsHelloWorldFn
    );
    const tsFibonacciIntegration = new HttpLambdaIntegration(
      "Typescript Fibonacci",
      tsFibonacciFn
    );
    const tsDynamodbIntegration = new HttpLambdaIntegration(
      "Typescript DynamoDB",
      tsDynamodbFn
    );

    const api = new HttpApi(this, "API Gateway");

    api.addRoutes({
      path: "/rust/hello",
      methods: [HttpMethod.GET],
      integration: rustHelloWorldIntegration,
    });

    api.addRoutes({
      path: "/rust/fibonacci",
      methods: [HttpMethod.GET],
      integration: rustFibonacciIntegration,
    });
    api.addRoutes({
      path: "/rust/dynamodb",
      methods: [HttpMethod.GET],
      integration: rustDynamodbIntegration,
    });

    api.addRoutes({
      path: "/ts/hello",
      methods: [HttpMethod.GET],
      integration: tsHelloWorldIntegration,
    });

    api.addRoutes({
      path: "/ts/fibonacci",
      methods: [HttpMethod.GET],
      integration: tsFibonacciIntegration,
    });
    api.addRoutes({
      path: "/ts/dynamodb",
      methods: [HttpMethod.GET],
      integration: tsDynamodbIntegration,
    });
  }
}
