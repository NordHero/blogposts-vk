import { APIGatewayProxyHandler } from "aws-lambda";

export const handler: APIGatewayProxyHandler = async () => {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/html",
    },
    body: '<!DOCTYPE html><html lang="en"><body><p>Hello world</p></body></html>',
  };
};
