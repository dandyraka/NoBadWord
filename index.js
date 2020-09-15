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
                if (state === 'CONFLICT') client.forceRefocus()
            })

            // listening on message
            client.onMessage((message) => {
                // Message Handler
                msgHandler(client, message)
            })
        })
        .catch((err) => new Error(err))
}
startServer()