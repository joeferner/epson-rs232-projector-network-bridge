use std::{net::SocketAddr, sync::Arc};

use anyhow::{Context, Result};
use axum::{
    response::{Html, IntoResponse},
    routing::{get, post},
};
use log::info;
use tokio::net::TcpListener;
use utoipa::OpenApi;
use utoipa_redoc::{Redoc, Servable as RedocServable};
use utoipa_swagger_ui::SwaggerUi;

use crate::{
    config::Config,
    routes::{self, get_status::get_status, post_power::post_power, post_source::post_source},
    state::EpsonState,
};

#[derive(OpenApi)]
#[openapi(
    info(title = "unisonht-epson-network-rs232-projector"),
    paths(
        routes::get_status::get_status,
        routes::post_source::post_source,
        routes::post_power::post_power
    ),
    components(schemas(
        routes::ErrorResponse,
        routes::EmptyResponse,
        routes::get_status::GetStatusResponse,
        routes::post_source::PostSourceRequest,
        routes::post_power::PostPowerRequest,
        super::epson_codec::Power,
        super::epson_codec::PowerStatus,
        super::epson_codec::Source,
    ))
)]
struct ApiDoc;

pub async fn http_start_server(config: &Config, state: Arc<EpsonState>) -> Result<()> {
    let socket_address: SocketAddr = format!("0.0.0.0:{}", config.http_port).parse().context("parse socket addr")?;
    let listener = TcpListener::bind(socket_address)
        .await
        .context(format!("binding to {socket_address}"))?;

    let app = axum::Router::new()
        .route("/api/v1/status", get(get_status))
        .route("/api/v1/source", post(post_source))
        .route("/api/v1/power", post(post_power));

    let app = app
        .route("/docs", get(handle_get_docs))
        .merge(SwaggerUi::new("/docs/swagger-ui").url("/docs/openapi.json", ApiDoc::openapi()))
        .merge(Redoc::with_url("/docs/redoc", ApiDoc::openapi()))
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
                <li><a href="/docs/redoc">redoc</a></li>
            </ul>
        </body>
    </html>"#,
    )
}
