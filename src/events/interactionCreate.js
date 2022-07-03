// eslint-disable-next-line no-unused-vars
const config = require('../config/config.json');
const ticket = require('../utils/ticket.js');

module.exports = {
    name: 'interactionCreate',
    once: false,
    // eslint-disable-next-line no-unused-vars
    async run(logChannel, interaction) {
        /* slash commands
        // interaction commands
        if (interaction.isCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            // exits if no existing commands
            if (!command) return console.log(`\x1b[31m%s\x1b[0m`, `[ERROR] No existing commands :(`);
            // tries to execute the specific command
            try {
                if (command.permissions && command.permissions.length > 0) {
                    if (!interaction.member.permissions.has(command.permissions)) return await interaction.reply({ content: `You don't have permission to use this command.` })
                }
                // executes the command
                await command.execute(interaction);
                // log
                const avatar = interaction.member.user.displayAvatarURL({ size: 4096, dynamic: true });
                const embed = {
                    color: config.colors.blue,
                    author: { name: 'Command Used', icon_url: avatar },
                    description: `<@${interaction.user.id}>\n${interaction.user.tag}`,
                    fields: [ { name: 'Command', value: interaction.commandName } ],
                    timestamp: new Date(),
                    footer: { text: `ID: ${interaction.user.id}` },
                };
                logChannel.send({ embeds: [embed] });
            } catch (error) {
                console.log(error);
                await interaction.reply({
                    content: config.interactions.error,
                    ephemeral: true,
                });
            };
        };
        */
        // tickets
        if (!interaction.isButton()) return;
        // eslint-disable-next-line no-unused-vars
        const { guild, customId, channel, member } = interaction;
        const type = config.categories.find(category => category.id === channel.parent.id);
        if (type === undefined) return;
        switch (customId) {
        case 'save_close_ticket':
            await ticket.close(guild, type.name, channel.name, interaction, null);
            break;
        case 'lock_ticket':
            ticket.lock(guild, type.name, channel.name, interaction, null);
            break;
        case 'unlock_ticket':
            interaction.reply('unlock_ticket');
            break;
        }
    },
};
