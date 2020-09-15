const { create } = require('@open-wa/wa-automate')
const { color } = require('./util')
const clientOptions = require('./util').options
const msgHandler = require('./handler/message')

const startServer = () => {
    create('xtrvts', clientOptions(true))
        .then((client) => {
            console.log('[DEV]', color('xtrvts', 'yellow'))
            console.log('[CLIENT] CLIENT Started!')

            // Force it to keep the current session
            client.onStateChanged((state) => {
                console.log('[Client State]', state)
                if (state === 'CONFLICT' || state === 'UNLAUNCHED') client.forceRefocus()
            })

            // listening on message
            client.onMessage((message) => {
                // Message Handler
                msgHandler(client, message)
            })

            // listen group invitation
            client.onAddedToGroup(({ groupMetadata: { id }, contact: { name } }) =>
                client.getGroupMembersId(id)
                    .then((ids) => {
                        console.log('[CLIENT]', color(`Invited to Group. [ ${name} : ${ids.length}]`, 'yellow'))
                    }))
        })
        .catch((err) => new Error(err))
}
startServer()