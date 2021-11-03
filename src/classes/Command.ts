import Discord, { CommandInteraction, Interaction } from "discord.js"
import { YarnGlobals } from "../utils/types"

export interface CommandMeta {
    name: string,
    enabled: boolean,
    description: string,
    options?: Discord.ApplicationCommandOptionData[],
    type?: Discord.ApplicationCommandType,
    usage?: string
}

export default class Cotton {
    client: Discord.Client
    meta: CommandMeta
    run: (client: Discord.Client, interaction: CommandInteraction, globals: object) => any

    constructor(meta: CommandMeta, run: (client: Discord.Client, interaction: CommandInteraction, globals: YarnGlobals) => any){
        this.meta = meta
        this.run = run
    }
}