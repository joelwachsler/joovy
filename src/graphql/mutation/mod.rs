use async_graphql::*;

#[derive(Default)]
pub struct Mutation;

#[Object]
impl Mutation {
    async fn my_mutation(&self) -> Result<i32> {
        Ok(321)
    }
}
