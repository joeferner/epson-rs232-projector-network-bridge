use std::sync::Arc;

use anyhow::Result;
use axum::{extract::State, response::IntoResponse, Json};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

use super::{EmptyResponse, ErrorResponse};
use crate::{epson_serial_port::Power, state::EpsonState};

#[derive(Serialize, Deserialize, Clone, Debug, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct PostPowerRequest {
    power: Power,
}

#[utoipa::path(
    operation_id = "setPower",
    post,
    path = "/api/v1/power",
    responses(
        (status = 200, description = "power set", body = EmptyResponse),
        (status = 500, description = "error", body = ErrorResponse)
    )
)]
pub async fn post_power(
    State(state): State<Arc<EpsonState>>,
    Json(req): Json<PostPowerRequest>,
) -> impl IntoResponse {
    match _post_power(state, req.power).await {
        Ok(_) => Json(EmptyResponse::new()).into_response(),
        Err(e) => Json(ErrorResponse {
            message: format!("{e}"),
        })
        .into_response(),
    }
}

async fn _post_power(state: Arc<EpsonState>, power: Power) -> Result<()> {
    state.epson.set_power(power).await?;
    Ok(())
}
