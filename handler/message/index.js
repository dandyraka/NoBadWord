const { color} = require('../../util')
const { cariKasar } = require('../../lib')
const moment = require('moment-timezone')
const appRoot = require('app-root-path')
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const db_group = new FileSync(appRoot+'/data/group.json')
const db = low(db_group)

moment.tz.setDefault('Asia/Jakarta').locale('id')
db.defaults({ group: []}).write()

module.exports = msgHandler = async (client, message) => {
    try {
        const { type, id, from, t, sender, isGroupMsg, chat, caption, isMedia, mimetype, quotedMsg, quotedMsgObj, mentionedJidList } = message
        let { body } = message
        const { name, formattedTitle } = chat
        let { pushname, verifiedName, formattedName } = sender
        pushname = pushname || verifiedName || formattedName // verifiedName is the name of someone who uses a business account
        if (pushname == undefined || pushname.trim() == '') console.log(sender)
        const botNumber = await client.getHostNumber() + '@c.us'
        const groupId = isGroupMsg ? chat.groupMetadata.id : ''
        const groupAdmins = isGroupMsg ? await client.getGroupAdmins(groupId) : ''
        const groupMembers = isGroupMsg ? await client.getGroupMembersId(groupId) : ''
        const isGroupAdmins = groupAdmins.includes(sender.id) || false
        const isBotGroupAdmins = groupAdmins.includes(botNumber) || false
        const pengirim = sender.id;

        const prefix = '#'
        body = (type === 'chat' && body.startsWith(prefix)) ? body : ((type === 'image' && caption) && caption.startsWith(prefix)) ? caption : ''
        const chats = message.body
        const command = body.slice(prefix.length).trim().split(/ +/).shift().toLowerCase()
        const args = body.slice(prefix.length).trim().split(/ +/).slice(1)
        const isCmd = body.startsWith(prefix)

        //if (!isCmd && !isGroupMsg) { return console.log('[RECV]', color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), 'yellow'), 'Message from', color(pushname)) }
        //if (!isCmd && isGroupMsg) { return console.log('[RECV]', color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), 'yellow'), 'Message from', color(pushname), 'in', color(name || formattedTitle)) }
        if (isCmd && !isGroupMsg) { console.log(color('[EXEC]'), color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), 'yellow'), color(`${command} [${args.length}]`), 'from', color(pushname)) }
        if (isCmd && isGroupMsg) { console.log(color('[EXEC]'), color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), 'yellow'), color(`${command} [${args.length}]`), 'from', color(pushname), 'in', color(name || formattedTitle)) }

        switch (command) {
            case 'reset':
                if(isGroupMsg){
                    if(groupAdmins.includes(pengirim)){
                        await client.sendText(from, "Ya, ini adalah reset")
                    } else {
                        await client.sendText(from, "Klasemen dapat direset oleh Admin Grup.")
                    }
                } else {
                    await client.sendText(from, "Hanya dapat dilakukan dalam Grup.")
                }
                break
            case 'klasemen':
                if(isGroupMsg){
                    const klasemen = db.get('group').filter({id: groupId}).map('members').value()[0]
                    let urut = Object.entries(klasemen).map(([key, val]) => ({id: key, ...val})).sort((a, b) => b.denda - a.denda);
                    let textKlas = "*Klasemen Denda Sementara*\n"
                    let i = 1;
                    urut.forEach((klsmn) => {
                        textKlas += i+". @"+klsmn.id.replace('@c.us', '')+" ➤ "+klsmn.denda+"\n"
                        //console.log(element.denda)
                        i++
                    });
                    await client.sendTextWithMentions(from, textKlas)
                } else {
                    await client.sendText(from, "Hanya dapat dilakukan dalam Grup.")
                }
                break
            default:
                console.log(color('[ERROR]', 'red'), color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), 'yellow'), 'Unregistered Command from', color(pushname))
                break
        }

        const inArray = (needle, haystack) => {
            let length = haystack.length;
            for(let i = 0; i < length; i++) {
                if(haystack[i].id == needle) return i;
            }
            return false;
        }

        if(!isCmd && isGroupMsg){
            const find = db.get('group').find({ id: groupId }).value()
            const isKasar = await cariKasar(chats)
            if(find && find.id === groupId){
                const cekuser = db.get('group').filter({id: groupId}).map('members').value()[0]
                const isIn = inArray(pengirim, cekuser)
                if(cekuser && isIn !== false){
                    if(isKasar){
                        const denda = db.get('group').filter({id: groupId}).map('members['+isIn+']').find({ id: pengirim }).update('denda', n => n + 5000).write()
                        if(denda){
                            await client.reply(from, "Jangan badword bodoh\nDenda +5000\nTotal : Rp."+denda.denda, id)
                        }
                    } else {
                        console.log("ganemu kata kasar")
                    }
                } else {
                    const getMembers = db.get('group').filter({id: groupId}).map('members[0]').push( {id: pengirim, denda: 0} ).value()
                    db.get('group').find({ id: groupId }).set('members', getMembers).write()
                }
            } else {
                if(isKasar){
                    db.get('group').push({ id: groupId, members: [{id: pengirim, denda: 5000}] }).write()
                    await client.reply(from, "Jangan badword bodoh\nDenda +5000\nTotal : Rp.5000", id)
                } else {
                    db.get('group').push({ id: groupId, members: [{id: pengirim, denda: 0}] }).write()
                }
            }
        }
    } catch (err) {
        console.log(color('[ERROR]', 'red'), err)
    }
}
