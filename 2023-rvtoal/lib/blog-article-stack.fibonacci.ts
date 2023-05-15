import { APIGatewayProxyHandler } from "aws-lambda";
import { BigNumber } from "bignumber.js";
const fibonacci = (n: number): BigNumber => {
  let a = new BigNumber(0);
  let b = new BigNumber(1);

  for (let i = 0; i < n; i++) {
    [a, b] = [b, a.plus(b)];
  }

  return a;
};

export const handler: APIGatewayProxyHandler = async () => {
  const n = 12345;
  const answer = fibonacci(n);
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/html",
    },
    body: `<!DOCTYPE html><html lang="en"><body><p>${n}nth Fibonacci is ${answer.toFixed()}</p></body></html>`,
  };
};
