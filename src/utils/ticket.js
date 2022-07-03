const { MessageActionRow, MessageButton } = require('discord.js');
const { createTranscript } = require('discord-html-transcripts');
const config = require('../config/config.json');

module.exports = {

    open: function(guild, type, customer, interaction, message) {
        const category = findCategory(type);
        if (category !== undefined) {
            if (!exists(guild, category, customer)) {
                try {
                    guild.channels.create(customer).then(channel => {
                        channel.setParent(category.id).then(ticketChannel => {
                            const [embed, buttons] = createTicketEmbed(guild, ticketChannel, category, false);
                            ticketChannel.send({ embeds: [embed], components: [buttons] }).then(() => {
                                // TODO: VIEW_CHANNEL: true & SEND_MESSAGES: true for customers in ticketChannel
                                // test with cosolegend account
                                const test_account = guild.members.cache.find(member => member.id === '584488107643240454');
                                ticketChannel.permissionOverwrites.edit(test_account, {
                                    VIEW_CHANNEL: true,
                                    SEND_MESSAGES: true,
                                }).then(() => {
                                    if (message != null) {
                                        message.reply(`Channel successfully opened in \`${category.name}\` category!`);
                                    }
                                });
                            });
                        });
                    });
                }
                catch (e) {
                    const display_message = 'There was a problem opening the ticket';
                    if (interaction != null) {
                        interaction.reply({
                            content: display_message,
                            ephemeral: true,
                        });
                    }
                    else if (message != null) {
                        message.reply(display_message);
                    }
                    console.error(e);
                }
            }
            else if (message != null) {
                message.reply(`Already existing channel in \`${category.name}\` category!`);
            }
        }
        else if (message != null) {
            message.reply(`\`${type}\` category doesn't exists!`);
        }
    },

    close: async function(guild, type, customer, interaction, message) {
        const category = findCategory(type);
        if (category !== undefined) {
            if (exists(guild, category, customer)) {
                try {
                    const ticketChannel = guild.channels.cache.find(channel => channel.name === customer && channel.parentId === category.id);
                    const transcriptChannel = guild.channels.cache.find(channel => channel.id === category.log);
                    const date = new Date();
                    const transcript = await createTranscript(ticketChannel, {
                        limit: -1,
                        returnBuffer: false,
                        fileName: `${type}_${date.toString().substring(0, date.toString().length - 39)}${customer}.html`,
                    });
                    const embed = {
                        color: config.colors.red,
                        author: {
                            name: `Transcript ${type}`,
                            icon_url: guild.members.cache.get(config.client).displayAvatarURL({
                                size: 4096,
                                dynamic: true,
                            }),
                        },
                        fields: [
                            { name: 'Ticket Name', value: ticketChannel.name },
                            // TODO: setup direct transcript sys
                            { name: 'Direct Transcript', value: '[Direct Transcript](https://xnorm.cloud)' },
                            // TODO: get users who sent messages in ticketChannel
                            { name: 'Users in Transcript', value: 'users' },
                        ],
                        timestamp: date,
                        footer: { text: `ID: ${customer}` },
                    };
                    transcriptChannel.send({ embeds: [embed], files: [transcript] });
                    if (interaction != null) {
                        interaction.reply('🔐 Ticket will be closed in 5 seconds!');
                    }
                    setTimeout(() => {
                        ticketChannel.delete().then(() => {
                            if (message != null) {
                                message.reply(`Channel successfully closed from \`${category.name}\` category!`);
                            }
                        });
                    }, 5000);
                }
                catch (error) {
                    const display_message = 'There was a problem closing the ticket';
                    if (interaction != null) {
                        interaction.reply(display_message);
                    }
                    else if (message != null) {
                        message.reply(display_message);
                    }
                    console.error(error);
                }
            }
            else if (message != null) {
                message.reply(`No provided customer channel in \`${category.name}\` category!`);
            }
        }
        else if (message != null) {
            message.reply(`\`${type}\` category doesn't exists!`);
        }
    },

    lock: function(guild, type, customer, interaction, message) {
        const category = findCategory(type);
        if (category !== undefined) {
            if (exists(guild, category, customer)) {
                try {
                    // eslint-disable-next-line no-unused-vars
                    const ticketChannel = guild.channels.cache.find(channel => channel.name === customer && channel.parentId === category.id);
                    // TODO: SEND_MESSAGES: false for customers in ticketChannel
                    // test with cosolegend account
                    const test_account = guild.members.cache.find(member => member.id === '584488107643240454');
                    ticketChannel.permissionOverwrites.edit(test_account, {
                        SEND_MESSAGES: false,
                    }).then(async () => {
                        await ticketChannel.messages.fetch({ after: 1, limit: 1 }).then(ticketMessages => {
                            const embedTicketMessage = ticketMessages.first();
                            const [embed, buttons] = createTicketEmbed(guild, ticketChannel, category, true);
                            embedTicketMessage.edit({ embeds: [embed], components: [buttons] }).then(() => {
                                const display_message = '🔒 Ticket locked!';
                                if (interaction != null) {
                                    interaction.reply(display_message);
                                }
                                else if (message != null) {
                                    message.reply(display_message);
                                }
                            },
                            );
                        });
                    });
                }
                catch (error) {
                    const display_message = 'There was a problem locking the ticket';
                    if (interaction != null) {
                        interaction.reply(display_message);
                    }
                    else if (message != null) {
                        message.reply(display_message);
                    }
                    console.error(error);
                }
            }
            else if (message != null) {
                message.reply(`No provided customer channel in \`${category.name}\` category!`);
            }
        }
        else if (message != null) {
            message.reply(`\`${type}\` category doesn't exists!`);
        }
    },

};

function findCategory(type) {
    return config.categories.find(group => group.name === type);
}

function exists(guild, category, customer) {
    return guild.channels.cache.find(channel => channel.name === customer && channel.parentId === category.id) !== undefined;
}

function createTicketEmbed(guild, ticketChannel, category, locked) {
    const bot = guild.members.cache.find(member => member.id === config.client);
    const embed = {
        color: locked ? config.colors.red : config.colors.blue,
        author: { name: `Welcome to ${category.name} ticket` },
        description: 'Please be patient, we will answer as soon as possible',
        thumbnail: { url: bot.displayAvatarURL({ size: 4096, dynamic: true }) },
        fields: [
            { name: 'Important info', value: category.info.join('\n') },
            { name: 'Status', value: locked ? '🔒 Locked' : '🔓 Unlocked' },
        ],
        timestamp: new Date(),
        footer: { text: `ID: ${ticketChannel.id}` },
    };
    const buttons = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId('save_close_ticket')
                .setLabel('💾 Save & Close')
                .setStyle('PRIMARY'),
            new MessageButton()
                .setURL('https://xnorm.cloud')
                .setLabel('🌐 Website')
                .setStyle('LINK'),
        );
    if (locked) {
        buttons.addComponents(
            new MessageButton()
                .setCustomId('unlock_ticket')
                .setLabel('🔓 Unlock')
                .setStyle('SUCCESS'),
        );
    }
    else {
        buttons.addComponents(
            new MessageButton()
                .setCustomId('lock_ticket')
                .setLabel('🔒 Lock')
                .setStyle('DANGER'),
        );
    }
    return [embed, buttons];
}
