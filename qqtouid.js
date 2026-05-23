import protobuf from "protobufjs/minimal.js"
const {
    Writer,
    Reader
} = protobuf

import zlib from 'node:zlib';
import { promisify } from 'util'

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

const NAPCAT_HTTP_HOST = '127.0.0.1' // napcat开启的http服务器host
const NAPCAT_HTTP_PORT = 3000 // napcat开启的http服务器端口
const NAPCAT_AUTH_TOKEN = 'uin_to_uid' // napcat鉴权token

function encode(obj) {
    const writer = Writer.create()
    for (const tag of Object.keys(obj).map(Number)) {
        const value = obj[tag]
        _encode(writer, tag, value)
    }
    return writer.finish()
}
function _encode(writer, tag, value) {
    switch (typeof value) {
        case "undefined":
            break
        case "number":
            writer.uint32((tag << 3) | 0).int32(value)
            break
        case "bigint":
            writer.uint32((tag << 3) | 0).int64(value.toString())
            break
        case "string":
            writer.uint32((tag << 3) | 2).string(value)
            break
        case "boolean":
            writer.uint32((tag << 3) | 0).bool(value)
            break
        case "object":
            if (Buffer.isBuffer(value) || value instanceof Uint8Array) {
                writer.uint32((tag << 3) | 2).bytes(value)
            } else if (Array.isArray(value)) {
                value.forEach(item => _encode(writer, tag, item))
            } else if (value === null) {
                break
            } else {
                const nestedBuffer = encode(value)
                writer.uint32((tag << 3) | 2).bytes(nestedBuffer)
            }
            break
        default:
            throw new Error("Unsupported type: " + (value && typeof value))
    }
}
function long2int(long) {
    if (long.high === 0)
        return long.low >>> 0
    const bigint = (BigInt(long.high) << 32n) | (BigInt(long.low) & 0xffffffffn)
    const int = Number(bigint)
    return Number.isSafeInteger(int) ? int : bigint
}
function decode(buffer) {
    if (typeof buffer === 'string') buffer = Buffer.from(buffer, "hex")
    const result = {}
    const reader = Reader.create(buffer)
    while (reader.pos < reader.len) {
        const k = reader.uint32()
        const tag = k >> 3,
            type = k & 0b111
        let value
        switch (type) {
            case 0:
                value = long2int(reader.int64())
                break
            case 1:
                value = long2int(reader.fixed64())
                break
            case 2:
                value = Buffer.from(reader.bytes())
                try {
                    value = decode(value)
                } catch {
                    try {
                        const decoded = value.toString('utf-8')
                        const reEncoded = Buffer.from(decoded, 'utf-8')
                        if (reEncoded.every((v, i) => v === value[i])) {
                            value = decoded
                        }
                    } catch {
                        // do nothing
                    }
                }
                break
            case 5:
                value = reader.fixed32()
                break
            default:
                throw new Error("Unsupported wire type: " + type)
        }

        if (Array.isArray(result[tag])) {
            result[tag].push(value)
        } else if (!!result[tag]) {
            result[tag] = [result[tag]]
            result[tag].push(value)
        } else {
            result[tag] = value
        }
    }
    return result
}
async function getResId(napcat,content){
    try {
        const data = {
            2: {
                1: "MultiMsg",
                2: {
                    1: [
                        {
                            3: {
                                1: {
                                    2:
                                        typeof content === "object" ? content : JSON.parse(content),
                                },
                            },
                        },
                    ],
                },
            },
        };
        const protoBytes = encode(data);
        const compressedData = await gzip(protoBytes);
        const json = {
            2: {
                1: 1,
                2: {
                    2: 9019901991,
                },
                3: `9019901991`,
                4: compressedData,
            },
            15: {
                1: 4,
                2: 2,
                3: 9,
                4: 0,
            },
        };
        const final = encode(json)
        let req
        if(napcat){
            req = await Bot[napcat].sendApi('send_packet', {
                cmd: "trpc.group.long_msg_interface.MsgService.SsoSendLongMsg",
                data: Buffer.from(final).toString("hex")
            })
        } else {
            req = await fetch(`http://${NAPCAT_HTTP_HOST}:${NAPCAT_HTTP_PORT}/send_packet`,{
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${NAPCAT_AUTH_TOKEN}`
                },
                body: JSON.stringify({
                    cmd: "trpc.group.long_msg_interface.MsgService.SsoRecvLongMsg",
                    data: Buffer.from(final).toString("hex")
                })
            })
            req = await req.json()
        }
        if(!req.data) return false
        const resp = decode(req.data);
        return resp["2"]?.["3"]?.toString()
    } catch (error) {
        console.error(`sendMessage failed: ${error.message}`, error);
        throw error;
    }
}
Bot.QQToUid = async(qq) => {
    if(!qq) return false
    let napcat
    for(const i of Bot.uin){
        if (Bot[i]?.adapter?.id === 'QQ') {
            napcat = i
        }
    }
    const content = {
        "45": {
            "1": 396,
            "2": qq,
            "3": 1779026325,
            "5": {
                "1": {
                    "1": "1"
                }
            },
            "8": {
                "3": 72057595654636146,
                "6": ""
            },
            "10": 0
        }
    }
    const resid = await getResId(napcat,content)
    if(!resid) return false
    const body = {
        1: {
            1: {
                2: "u_kczS7KjjVfPE1k37wIEvxg",
            },
            2: resid,
            3: true,
        },
        15: {
            1: 2,
            2: 0,
            3: 0,
            4: 0,
        },
    };
    const final = encode(body);
    let result
    if (napcat){
        result = await Bot[napcat].sendApi('send_packet', {
            cmd: "trpc.group.long_msg_interface.MsgService.SsoRecvLongMsg",
            data: Buffer.from(final).toString("hex")
        })
    } else {
        result = await fetch(`http://${NAPCAT_HTTP_HOST}:${NAPCAT_HTTP_PORT}/send_packet`,{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${NAPCAT_AUTH_TOKEN}`
            },
            body: JSON.stringify({
                cmd: "trpc.group.long_msg_interface.MsgService.SsoRecvLongMsg",
                data: Buffer.from(final).toString("hex")
            })
        })
        result = await result.json()
    }
    if(!result.data) return false
    const payload = decode(result.data)
    if(!payload[1]?.[4]) return false
    let data = await gunzip(payload[1][4])
    if(!data) return false
    let multimsg = decode(data)
    if(multimsg?.['2']?.['2']?.['1']?.['3']?.['1']?.['2']?.['45']?.['8']?.['6'])
        return multimsg['2']['2']['1']['3']['1']['2']['45']['8']['6']
    else
        return false
}
export class qqtouid extends plugin {
    constructor() {
        super({
            name: "qqtouid",
            dsc: "qqtouid",
            event: "message",
            priority: 100,
            rule: [
                {
                    reg: "^#?转uid",
                    fnc: 'qqtouid'
                }
            ],
        });
    }
    async qqtouid(e){
        if(this.e.adapter_id !== 'QQ') return
        let qq = Number(this.e.msg.replace(/#?转uid/,'').trim())
        if(!qq) {
            if(e.at) qq = e.at
            else return this.reply('请输入正确的qq')
        }
        let uid = await Bot.QQToUid(qq)
        if(!uid) return this.reply('获取uid失败')
        this.reply(uid)
    }
}
