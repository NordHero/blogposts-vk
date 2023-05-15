use chrono::{DateTime, Utc};
use fake::Fake;
use rand::prelude::SliceRandom;
use rand::Rng;
use rusoto_core::Region;
use rusoto_dynamodb::{AttributeValue, DynamoDb, DynamoDbClient, PutItemInput};
use std::collections::HashMap;
use tokio;
use uuid::Uuid;

#[tokio::main]
async fn main() {
    let client = DynamoDbClient::new(Region::EuNorth1);

    for _ in 0..1000 {
        let item = create_random_item();
        let put_item_input = PutItemInput {
            table_name: "BlogArticleStack-Items".to_string(),
            item,
            ..Default::default()
        };

        match client.put_item(put_item_input).await {
            Ok(_) => (),
            Err(e) => println!("Error adding item: {}", e),
        }
    }
}

fn create_random_item() -> HashMap<String, AttributeValue> {
    let user_ids = ["rustin", "martin", "reggie", "steve", "ted"];

    let mut rng = rand::thread_rng();
    let user_id = user_ids.choose(&mut rng).unwrap().to_string();
    let now: DateTime<Utc> = Utc::now();
    let mut item = HashMap::new();

    item.insert(
        "PK".to_string(),
        attribute_string(format!("USER#{}", user_id)),
    );
    item.insert(
        "SK".to_string(),
        attribute_string(format!("ITEM#{}", Uuid::new_v4().to_string())),
    );
    item.insert("userId".to_string(), attribute_string(user_id));
    item.insert("title".to_string(), attribute_string((3..5).fake()));
    item.insert("description".to_string(), attribute_string((10..20).fake()));
    item.insert(
        "price".to_string(),
        attribute_number(rng.gen_range(1.0..1000.0).to_string()),
    );
    item.insert(
        "pictures".to_string(),
        attribute_list(
            (0..rng.gen_range(1..6))
                .map(|_| attribute_string(generate_random_image_url()))
                .collect(),
        ),
    );
    item.insert("createdAt".to_string(), attribute_string(now.to_rfc3339()));

    item
}

fn attribute_string(value: String) -> AttributeValue {
    AttributeValue {
        s: Some(value),
        ..Default::default()
    }
}

fn attribute_number(value: String) -> AttributeValue {
    AttributeValue {
        n: Some(value),
        ..Default::default()
    }
}

fn attribute_list(value: Vec<AttributeValue>) -> AttributeValue {
    AttributeValue {
        l: Some(value),
        ..Default::default()
    }
}

fn generate_random_image_url() -> String {
    let width: u32 = (200..300).fake();
    let height: u32 = (200..300).fake();
    let image_domain = "example.com";

    format!("https://{}/image/{}x{}.jpg", image_domain, width, height)
}
