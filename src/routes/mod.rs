use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

pub mod get_status;
pub mod post_source;

#[derive(Serialize, Deserialize, Clone, Debug, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct ErrorResponse {
    pub message: String,
}

#[derive(Serialize, Deserialize, Clone, Debug, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct EmptyResponse {}

impl EmptyResponse {
    pub fn new() -> Self {
        EmptyResponse {}
    }
}
