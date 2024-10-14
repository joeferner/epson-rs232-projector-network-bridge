use std::sync::Arc;

use anyhow::Result;
use axum::{extract::State, response::IntoResponse, Json};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use log::error;

use super::{EmptyResponse, ErrorResponse};
use crate::{epson_serial_port::Source, state::EpsonState};

#[derive(Serialize, Deserialize, Clone, Debug, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct PostSourceRequest {
    source: Source,
}

#[utoipa::path(
    operation_id = "setSource",
    post,
    path = "/api/v1/source",
    responses(
        (status = 200, description = "source set", body = EmptyResponse),
        (status = 500, description = "error", body = ErrorResponse)
    )
)]
pub async fn post_source(
    State(state): State<Arc<EpsonState>>,
    Json(req): Json<PostSourceRequest>,
) -> impl IntoResponse {
    match _post_source(state, req.source).await {
        Ok(_) => Json(EmptyResponse::new()).into_response(),
        Err(e) => {
            error!("failed to set source; error = {e}");
            Json(ErrorResponse {
                message: format!("{e}"),
            }).into_response()
        },
    }
}

async fn _post_source(state: Arc<EpsonState>, source: Source) -> Result<()> {
    state.epson.set_source(source).await?;
    Ok(())
}
