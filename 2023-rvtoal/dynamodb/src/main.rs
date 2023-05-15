use lambda_http::{lambda_runtime::Error, run, service_fn, Body, Request, Response};
use lazy_static::lazy_static;
use rusoto_core::Region;
use rusoto_dynamodb::{AttributeValue, DynamoDb, DynamoDbClient, QueryInput};
use serde::Deserialize;
use std::env;
use std::fmt::Write;

lazy_static! {
    static ref DYNAMO_DB_CLIENT: DynamoDbClient = DynamoDbClient::new(Region::default());
    static ref TABLE_NAME: String = env::var("TABLE_NAME").expect("Cannot read TABLE_NAME");
}

#[derive(Debug, Deserialize)]
struct Item {
    pk: String,
    title: String,
    description: String,
    price: String,
}

async fn query_dynamodb(client: &DynamoDbClient) -> Result<Vec<Item>, Error> {
    let query_input = QueryInput {
        table_name: TABLE_NAME.to_string(),
        expression_attribute_names: Some(
            [("#user_id".to_string(), "PK".to_string())]
                .iter()
                .cloned()
                .collect(),
        ),
        expression_attribute_values: Some(
            [(
                ":user".to_string(),
                AttributeValue {
                    s: Some("USER#rustin".to_string()),
                    ..Default::default()
                },
            )]
            .iter()
            .cloned()
            .collect(),
        ),
        key_condition_expression: Some("#user_id = :user".to_string()),
        ..Default::default()
    };

    let result = client.query(query_input).await?;
    let items: Vec<Item> = result
        .items
        .unwrap_or_default()
        .into_iter()
        .map(|item| Item {
            pk: item["PK"].s.clone().unwrap(),
            title: item["title"].s.clone().unwrap(),
            description: item["description"].s.clone().unwrap(),
            price: item["price"].n.clone().unwrap(),
        })
        .collect();
    Ok(items)
}

async fn function_handler(_: Request) -> Result<Response<Body>, Error> {
    let items = query_dynamodb(&DYNAMO_DB_CLIENT).await?;

    let mut results = String::from("<table>");
    for item in items {
        writeln!(
            &mut results,
            "<tr><td>{}</td><td>{}</td><td>{}</td><td>{}</td></tr>",
            item.pk, item.title, item.description, item.price
        )?;
    }
    results.push_str("</table>");

    let html = format!(r#"<!DOCTYPE html><html lang="en"><body>{results}</body></html>"#);

    Ok(Response::builder()
        .status(200)
        .header("Content-Type", "text/html")
        .body(Body::from(html))
        .unwrap())
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
