use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

pub mod get_power_status;

#[derive(Serialize, Deserialize, Clone, Debug, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct ErrorResponse {
    pub message: String,
}
