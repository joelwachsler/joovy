use anyhow::Result;
use std::fmt::Display;
use tracing::{error, info};

use super::CommandContext;
use serenity::model::application::interaction::InteractionResponseType;

impl CommandContext {
    /// Should only be used once per slash command to acknowledge the command.
    pub async fn reply_ack(&self, msg: impl Display) -> Result<()> {
        info!("Reply ack with: {}", msg);
        let _ = self
            .interaction
            .create_interaction_response(&self.ctx, |response| {
                response
                    .kind(InteractionResponseType::ChannelMessageWithSource)
                    .interaction_response_data(|message| {
                        message.embed(|embed| embed.description(msg))
                    })
            })
            .await
            .map_err(|why| error!("Failed to create response: {}", why));

        Ok(())
    }

    pub async fn reply(&self, msg: impl Display) -> Result<()> {
        info!("Replying with: {}", msg);
        self.interaction
            .create_followup_message(&self.ctx, |message| {
                message.embed(|embed| embed.description(msg))
            })
            .await?;

        Ok(())
    }

    pub async fn send(&self, msg: impl Display) -> Result<()> {
        info!("Sending: {}", msg);
        self.text_channel_id()
            .await
            .send_message(&self.ctx, |message| {
                message.embed(|embed| embed.description(msg))
            })
            .await?;

        Ok(())
    }
}
