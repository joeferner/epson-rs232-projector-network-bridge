use std::sync::Arc;

use anyhow::Result;
use axum::{extract::State, response::IntoResponse, Json};
use log::error;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

use super::ErrorResponse;
use crate::{
    epson_codec::{PowerStatus, Source},
    state::EpsonState,
};

#[derive(Serialize, Deserialize, Clone, Debug, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct GetStatusResponse {
    status: PowerStatus,
    source: Source,
}

#[utoipa::path(
    operation_id = "getStatus",
    get,
    path = "/api/v1/status",
    responses(
        (status = 200, description = "current status", body = GetStatusResponse),
        (status = 500, description = "error", body = ErrorResponse)
    )
)]
pub async fn get_status(State(state): State<Arc<EpsonState>>) -> impl IntoResponse {
    match _get_status(state).await {
        Ok(resp) => Json(resp).into_response(),
        Err(e) => {
            error!("failed to get status; error = {e}");
            Json(ErrorResponse {
                message: format!("{e}"),
            })
            .into_response()
        }
    }
}

async fn _get_status(state: Arc<EpsonState>) -> Result<GetStatusResponse> {
    let status = state.epson.get_power_status().await?;
    let source = state.epson.get_source().await?;

    Ok(GetStatusResponse { status, source })
}
