import { APIGatewayProxyHandler } from "aws-lambda";
import {
  DynamoDBClient,
  QueryCommand,
  QueryCommandInput,
  QueryCommandOutput,
} from "@aws-sdk/client-dynamodb";

const DYNAMODB_TABLE_NAME = process.env.TABLE_NAME!;
const DYNAMODB_CLIENT = new DynamoDBClient({});

const query_dynamodb = (): Promise<QueryCommandOutput> => {
  const queryInput: QueryCommandInput = {
    TableName: DYNAMODB_TABLE_NAME,
    ExpressionAttributeNames: {
      "#user_id": "PK",
    },
    ExpressionAttributeValues: {
      ":user": { S: "USER#rustin" },
    },
    KeyConditionExpression: "#user_id = :user",
  };

  const queryCommand: QueryCommand = new QueryCommand(queryInput);
  return DYNAMODB_CLIENT.send(queryCommand);
};

type Item = {
  PK: { S: string };
  title: { S: string };
  description: { S: string };
  price: { N: string };
};

export const handler: APIGatewayProxyHandler = async () => {
  const items = (await query_dynamodb()).Items! as Item[];

  let results = "<table>";
  for (const item of items) {
    results += `<tr><td>${item.PK.S!}</td><td>${item.title.S!}</td><td>${item
      .description.S!}</td><td>${item.price.N!}</td></tr>`;
  }
  results += "</table>";

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/html",
    },
    body: `<!DOCTYPE html><html lang="en"><body>${results}</body></html>`,
  };
};
