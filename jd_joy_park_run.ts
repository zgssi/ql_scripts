/**
 * 汪汪赛跑
 * 默认翻倍到0.08红包结束
 * export JD_JOY_PARK_RUN_ASSETS="0.08"
 * cron: 20 * * * *
 * new Env('汪汪赛跑')
 */

import { get, post, requireConfig, wait, o2s } from './TS_USER_AGENTS'
import { H5ST } from "./utils/h5st"
import { getDate } from "date-fns";

let cookie: string = '', UserName: string = ''
let captainId: string = '', h5stTool: H5ST = new H5ST('b6ac3', 'jdltapp;', '1804945295425750')

!(async () => {
    let cookiesArr: string[] = await requireConfig()
    for (let [index, value] of cookiesArr.entries()) {
        cookie = value
        UserName = decodeURIComponent(cookie.match(/pt_pin=([^;]*)/)![1])
        console.log(`\n开始【京东账号${index + 1}】${UserName}\n`)
        let assets: number = parseFloat(process.env.JD_JOY_PARK_RUN_ASSETS || '0.04')
        let rewardAmount: number = 0
        try {
            h5stTool = new H5ST('448de', 'jdltapp;', process.env.FP_448DE || '')
            await h5stTool.__genAlgo()
            let res: any = await team('runningMyPrize', { "linkId": "L-sOanK_5RJCz7I314FpnQ", "pageSize": 20, "time": null, "ids": null })
            let sum: number = 0, success: number = 0
            rewardAmount = res.data.rewardAmount
            if (res.data.runningCashStatus.currentEndTime && res.data.runningCashStatus.status === 0) {
                console.log('可提现', rewardAmount)
                res = await api('runningPrizeDraw', { "linkId": "L-sOanK_5RJCz7I314FpnQ", "type": 2 })
                await wait(2000)
                console.log(res.data?.message || res.errMsg)
            }

            for (let t of res?.data?.detailVos || []) {
                if (t.amount > 0 && getDate(new Date(t.createTime)) === new Date().getDate()) {
                    sum = add(sum, t.amount)
                    success++
                } else {
                    break
                }
            }
            console.log('成功', success)
            console.log('收益', parseFloat(sum.toFixed(2)))
            res = await team('runningTeamInfo', { "linkId": "L-sOanK_5RJCz7I314FpnQ" })
            if (!captainId) {
                if (res.data.members.length === 0) {
                    console.log('成为队长')
                    captainId = res.data.captainId
                } else if (res.data.members.length !== 6) {
                    console.log('队伍未满', res.data.members.length)
                    captainId = res.data.captainId
                } else {
                    console.log('队伍已满')
                }
            } else if (captainId && res.data.members.length === 0) {
                console.log('已有组队ID，未加入队伍')
                res = await team('runningJoinTeam', { "linkId": "L-sOanK_5RJCz7I314FpnQ", "captainId": captainId })
                if (res.code === 0) {
                    console.log('组队成功')
                    for (let member of res.data.members) {
                        if (member.captain) {
                            console.log('队长', member.nickName)
                            break
                        }
                    }
                    if (res.data.members.length === 6) {
                        console.log('队伍已满')
                        captainId = ''
                    }
                } else {
                    o2s(res, '组队失败')
                }
            } else {
                console.log('已组队', res.data.members.length)
                console.log('战队收益', res.data.teamSumPrize)
            }

            h5stTool = new H5ST('b6ac3', 'jdltapp;', process.env.FP_B6AC3 || '')
            await h5stTool.__genAlgo()
            res = await runningPageHome()
            console.log('🧧', res.data.runningHomeInfo.prizeValue)
            console.log('💊', res.data.runningHomeInfo.energy)
            let energy: number = res.data.runningHomeInfo.energy
            await wait(2000)

            console.log('⏳', secondsToMinutes(res.data.runningHomeInfo.nextRunningTime / 1000))
            if (res.data.runningHomeInfo.nextRunningTime && res.data.runningHomeInfo.nextRunningTime / 1000 < 300) {
                console.log('⏳')
                await wait(res.data.runningHomeInfo.nextRunningTime + 3000)
                res = await runningPageHome()
                await wait(1000)
            }
            await startRunning(res, assets)

            res = await runningPageHome()
            for (let i = 0; i < energy; i++) {
                if (res.data.runningHomeInfo.nextRunningTime / 1000 < 3000)
                    break
                console.log('💉')
                res = await api('runningUseEnergyBar', { "linkId": "L-sOanK_5RJCz7I314FpnQ" })
                console.log(res.errMsg)
                res = await runningPageHome()
                await startRunning(res, assets)
                await wait(1000)
            }

            res = await runningPageHome()
            console.log('🧧', res.data.runningHomeInfo.prizeValue)
            await wait(2000)
        } catch (e) {
            console.log('Error', e)
            await wait(3000)
        }
    }
})()

async function startRunning(res: any, assets: number) {
    if (!res.data.runningHomeInfo.nextRunningTime) {
        console.log('终点目标', assets)
        for (let i = 0; i < 5; i++) {
            res = await api('runningOpenBox', { "linkId": "L-sOanK_5RJCz7I314FpnQ" })
            if (parseFloat(res.data.assets) >= assets) {
                let assets: number = parseFloat(res.data.assets)
                res = await api('runningPreserveAssets', { "linkId": "L-sOanK_5RJCz7I314FpnQ" })
                console.log('领取成功', assets)
                break
            } else {
                if (res.data.doubleSuccess) {
                    console.log('翻倍成功', parseFloat(res.data.assets))
                    await wait(10000)
                } else if (!res.data.doubleSuccess && !res.data.runningHomeInfo.runningFinish) {
                    console.log('开始跑步', parseFloat(res.data.assets))
                    await wait(10000)
                } else {
                    console.log('翻倍失败')
                    break
                }
            }
        }
    }
    await wait(3000)
}

async function api(fn: string, body: object) {
    let timestamp: number = Date.now(), h5st: string = ''
    if (fn === 'runningOpenBox') {
        h5st = h5stTool.__genH5st({
            appid: "activities_platform",
            body: JSON.stringify(body),
            client: "ios",
            clientVersion: "3.1.0",
            functionId: fn,
            t: timestamp.toString()
        })
    }
    let params: string = `functionId=${fn}&body=${JSON.stringify(body)}&t=${timestamp}&appid=activities_platform&client=ios&clientVersion=3.1.0&cthr=1`
    h5st && (params += `&h5st=${h5st}`)
    return await post('https://api.m.jd.com/', params, {
        'authority': 'api.m.jd.com',
        'content-type': 'application/x-www-form-urlencoded',
        'cookie': cookie,
        'origin': 'https://h5platform.jd.com',
        'referer': 'https://h5platform.jd.com/',
        'user-agent': 'jdltapp;iPhone;3.1.0;'
    })
}

async function runningPageHome() {
    return get(`https://api.m.jd.com/?functionId=runningPageHome&body=%7B%22linkId%22:%22L-sOanK_5RJCz7I314FpnQ%22,%22isFromJoyPark%22:true,%22joyLinkId%22:%22LsQNxL7iWDlXUs6cFl-AAg%22%7D&t=${Date.now()}&appid=activities_platform&client=ios&clientVersion=3.1.0`, {
        'Host': 'api.m.jd.com',
        'Origin': 'https://h5platform.jd.com',
        'User-Agent': 'jdltapp;',
        'Referer': 'https://h5platform.jd.com/',
        'Cookie': cookie
    })
}

async function team(fn: string, body: object) {
    let timestamp: number = Date.now()
    let h5st: string = ''
    return await get(`https://api.m.jd.com/?functionId=${fn}&body=${encodeURIComponent(JSON.stringify(body))}&t=${timestamp}&appid=activities_platform&client=ios&clientVersion=3.1.0&cthr=1&h5st=${h5st}`, {
        'Host': 'api.m.jd.com',
        'User-Agent': 'jdltapp;',
        'Origin': 'https://h5platform.jd.com',
        'X-Requested-With': 'com.jd.jdlite',
        'Referer': 'https://h5platform.jd.com/',
        'Cookie': cookie
    })
}

// 秒转分:秒
function secondsToMinutes(seconds: number) {
    let minutes: number = Math.floor(seconds / 60)
    let second: number = Math.floor(seconds % 60)
    return `${minutes}分${second}秒`
}

// 小数加法
function add(num1: number, num2: number) {
    let r1: number, r2: number
    try {
        r1 = num1.toString().split('.')[1].length
    } catch (e) {
        r1 = 0
    }
    try {
        r2 = num2.toString().split('.')[1].length
    } catch (e) {
        r2 = 0
    }
    let m: number = Math.pow(10, Math.max(r1, r2))
    return (num1 * m + num2 * m) / m
}