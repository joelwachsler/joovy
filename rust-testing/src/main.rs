#[tokio::main]
async fn main() {
    let test = testing().await;
    println!("From my function: {}", test.unwrap());
    println!("This is async!");
    let web_request_res = test_web_request()
        .await
        .unwrap();
    println!("From request: {}", web_request_res);

    let mut person = Person::new("test".to_string());
    person.update_name("test_2".to_string());

    println!("The person is: {:?}", person);
}

async fn testing() -> Result<String, String> {
    Result::Ok("testing".to_string())
}

async fn test_web_request() -> reqwest::Result<String> {
    reqwest::get("https://www.rust-lang.org")
        .await?
        .text()
        .await
}

#[derive(Debug)]
struct Person {
    name: String,
}

impl Person {
    pub fn new(name: String) -> Self {
        Self {
            name,
        }
    }

    pub fn update_name(&mut self, new_name: String) {
        self.name = new_name
    }
}

#[cfg(test)]
mod tests {
  #[test]
  fn testing() {
    assert_eq!(2 + 2, 4);
  }
}
