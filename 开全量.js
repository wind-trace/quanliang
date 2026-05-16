export class quanliang extends plugin {
    constructor() {
        super({
            name: "quanliang",
            dsc: "quanliang",
            event: "message",
            priority: 100,
            rule: [{
                reg: "^#?开全量",
                fnc: 'quanliang'
            }
            ],
        });
    }
    async quanliang(e){
        if(!e.isMaster) return false
        if(this.e.adapter_id === 'QQ'){
            if(!e.at) return this.reply('请艾特要开启全量的官机')
            let userdata = await this.e.bot.sendApi('get_stranger_info',{
                user_id:e.at
            })
            let uid = userdata.data.uid
            let group_id = Number(this.e.msg.replace(/#?开全量/,'').trim()) || e.group_id
            const info = {
                page_name: 'ai_group_service_agreement_pop_page',
                groupCode: Number(group_id),
                botUin: Number(e.at),
                botUid: uid,
                screen: 1
            }
            let url = `https://club.vip.qq.com/transfer?open_kuikly_info=${encodeURIComponent(JSON.stringify(info))}`
            e.reply('默认使用本群，如果需要指定群则艾特对应官机+开全量+群号\n'+url)
        } else if(this.e.adapter_id === 'QQBot'){
            //if(e.raw.t.==='GROUP_MESSAGE_CREATE') return this.reply('本群已经开启了全量主动消息')
            let group_id = Number(this.e.msg.replace(/#?开全量/,'').trim())
            if (!group_id) return this.reply(['请发送群号\r示例：开全量123456789\r若群号输入错误则无法成功授权\r![img #1080px #888px](https://cnb.cool/windtrace/wind-img/-/git/raw/main/%E5%85%A8%E9%87%8F%E4%B8%BB%E5%8A%A8.jpeg)',segment.button([{text:'开全量',input:'开全量'}])])
            for (const i of Bot.uin){
                if(Bot[i].adapter?.id === 'QQ'){
                    let user = await Bot[i].sendApi('get_stranger_info',{
                        user_id:e.self_id
                    })
                    let uid = user.data?.uid
                    const info = {
                        page_name: 'ai_group_service_agreement_pop_page',
                        groupCode: Number(group_id),
                        botUin: Number(e.self_id),
                        botUid: uid,
                        screen: 1
                    }
                    let url = `https://club.vip.qq.com/transfer?open_kuikly_info=${encodeURIComponent(JSON.stringify(info))}`
                    return this.reply(['请群主点击下放按钮授权\r#需要更新QQ到最新版本(9.2.90正式版以上)\r若群号输入错误则无法成功授权\r![img #1080px #888px](https://cnb.cool/windtrace/wind-img/-/git/raw/main/%E5%85%A8%E9%87%8F%E4%B8%BB%E5%8A%A8.jpeg)',segment.button([{text:'请群主点击此按钮授权',link:url}])])
                }
            }
            return false
        }
        return false
    }
}
