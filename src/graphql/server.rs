use actix_web::{middleware, web, HttpRequest};
use anyhow::Result;
use async_graphql::{Context, EmptySubscription, Schema};
use async_graphql_actix_web::{GraphQLRequest, GraphQLResponse};
use sea_orm::DatabaseConnection;
use std::env;
use tracing::info;

use crate::graphql::{mutation::Mutation, query::Query};

#[derive(Debug, Clone)]
pub struct AppState {
    conn: DatabaseConnection,
}

impl AppState {
    fn new(conn: DatabaseConnection) -> Self {
        Self { conn }
    }

    pub fn conn(&self) -> &DatabaseConnection {
        &self.conn
    }
}

pub trait WithAppState {
    fn app_state(&self) -> &AppState;
}

impl WithAppState for Context<'_> {
    fn app_state(&self) -> &AppState {
        self.data().expect("Failed to get AppState")
    }
}

pub async fn start_graphql_server(conn: DatabaseConnection) -> Result<()> {
    let host = env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string());
    let port = env::var("PORT").unwrap_or_else(|_| "4000".to_string());
    let server_url = format!("{}:{}", host, port);

    let schema = Schema::build(Query::default(), Mutation::default(), EmptySubscription)
        .data(AppState::new(conn))
        .enable_federation()
        .finish();

    let mut server = actix_web::HttpServer::new(move || {
        actix_web::App::new()
            .app_data(web::Data::new(schema.to_owned()))
            .wrap(middleware::Logger::default())
            .configure(config)
    });

    server = server.bind(&server_url)?;
    info!("Listening on {}", server_url);
    server.workers(2).run().await?;

    Ok(())
}

fn config(cfg: &mut web::ServiceConfig) {
    cfg.service(web::resource("/").route(web::get().to(|| async { "ok" })));
    cfg.service(web::resource("/graphql").route(web::post().to(graphql_route)));
}

async fn graphql_route(
    schema: web::Data<Schema<Query, Mutation, EmptySubscription>>,
    _: HttpRequest,
    gql_request: GraphQLRequest,
) -> GraphQLResponse {
    let request = gql_request.into_inner();
    // if let Some(user_context) = UserContext::from_headers(req.headers()) {
    //     request = request.data(user_context);
    // }

    schema.execute(request).await.into()
}
