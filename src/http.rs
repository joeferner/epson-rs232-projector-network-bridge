use std::{net::SocketAddr, sync::Arc};

use anyhow::{Context, Result};
use axum::{
    response::{Html, IntoResponse},
    routing::get,
};
use log::info;
use tokio::net::TcpListener;
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;

use crate::state::State;

#[derive(OpenApi)]
#[openapi(info(title = "unisonht-epson-network-rs232-projector"))]
struct ApiDoc;

pub async fn http_start_server(state: Arc<State>) -> Result<()> {
    let socket_address: SocketAddr = "0.0.0.0:8080".parse().context("parse socket addr")?;
    let listener = TcpListener::bind(socket_address)
        .await
        .context(format!("binding to {socket_address}"))?;

    let app = axum::Router::new();

    let app = app
        .route("/docs", get(handle_get_docs))
        .merge(SwaggerUi::new("/docs/swagger-ui").url("/docs/openapi.json", ApiDoc::openapi()))
        .with_state(state);

    info!("listening http://localhost:8080/docs");
    axum::serve(listener, app.into_make_service())
        .await
        .context("serving")
}

async fn handle_get_docs() -> impl IntoResponse {
    Html(
        r#"<html>
        <head>
            <title>Requeue Docs</title>
        </head>
        <body>
            <ul>
                <li><a href="/docs/openapi.json">openapi.json</a></li>
                <li><a href="/docs/swagger-ui">swagger-ui</a></li>
            </ul>
        </body>
    </html>"#,
    )
}
