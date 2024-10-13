use anyhow::Result;
use http::http_start_server;

mod http;

#[tokio::main]
async fn main() -> Result<()> {
    http_start_server().await?;
    Ok(())
}
