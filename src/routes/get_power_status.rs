use std::sync::Arc;

use anyhow::Result;
use axum::{extract::State, response::IntoResponse, Json};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

use super::ErrorResponse;
use crate::{epson_serial_port::PowerStatus, state::EpsonState};

#[derive(Serialize, Deserialize, Clone, Debug, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct PowerStatusResponse {
    status: PowerStatus,
}

#[utoipa::path(
    operation_id = "getPowerStatus",
    get,
    path = "/api/v1/power",
    responses(
        (status = 200, description = "current power status", body = PowerStatusResponse),
        (status = 500, description = "error", body = ErrorResponse)
    )
)]
pub async fn get_power_status(State(state): State<Arc<EpsonState>>) -> impl IntoResponse {
    match _get_power_status(state).await {
        Ok(resp) => Json(resp).into_response(),
        Err(e) => Json(ErrorResponse {
            message: format!("{e}"),
        })
        .into_response(),
    }
}

async fn _get_power_status(state: Arc<EpsonState>) -> Result<PowerStatusResponse> {
    let status = state.epson.get_power_status().await?;

    Ok(PowerStatusResponse { status })
}
