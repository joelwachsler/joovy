use std::process::Command;

fn main() {
    let res = Command::new("find")
        .arg(".")
        .arg("-type")
        .arg("f")
        .spawn()
        .expect("failed to run command")
        .wait();

    let res_unwrap = res.unwrap();
    println!("Got this: {}", res_unwrap);
}

#[cfg(test)]
mod tests {
  #[test]
  fn testing() {
    assert_eq!(2 + 2, 4);
  }
}
