use lambda_http::{run, service_fn, Body, Error, Request, Response};
use num_bigint::BigUint;
use std::mem;

fn fibonacci(n: u64) -> BigUint {
    let mut a: BigUint = "0".parse().unwrap();
    let mut b: BigUint = "1".parse().unwrap();

    for _ in 0..n {
        mem::swap(&mut a, &mut b);
        b += &a;
    }

    a
}

async fn function_handler(_event: Request) -> Result<Response<Body>, Error> {
    let n = 12345;
    let answer = fibonacci(n);
    let message = format!(
        "<!DOCTYPE html><html lang=\"en\"><body><p>{}nth Fibonacci is {}</p></body></html>",
        n, answer
    );

    let resp = Response::builder()
        .status(200)
        .header("content-type", "text/html")
        .body(message.into())
        .map_err(Box::new)?;
    Ok(resp)
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .with_target(false)
        .without_time()
        .init();

    run(service_fn(function_handler)).await
}
