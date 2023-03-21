/*
cron "58 23 * * *" jd_joyrunning_TX.js, tag:汪汪赛跑兑换红包
 */
 
 //ccwav,2023-02-15
 const $ = new Env("汪汪赛跑兑换红包");
 const notify = $.isNode() ? require('./sendNotify') : '';
 const jdCookieNode = $.isNode() ? require("./jdCookie.js") : "";
 let cookiesArr = [];
 let runcookiesArr = [],TaskList = [];
 let success10Arr = [],success3Arr = []
 let duihuanminamt=10; //过滤掉低于duihuanminamt的账号
 let maxThread=99; //并发数
 let isrun3=false; //是否兑换3元
 let lntype=1; //lntype=1 红包 lntype=2 提现
 let strMessage="";
 if ($.isNode()) {
     Object.keys(jdCookieNode).forEach((item) => {
         cookiesArr.push(jdCookieNode[item])
     })
 }
 let WP_APP_TOKEN_ONE = "";
 if ($.isNode()) {
     if (process.env.WP_APP_TOKEN_ONE) {		
         WP_APP_TOKEN_ONE = process.env.WP_APP_TOKEN_ONE;
     }	
 }
 
 if(WP_APP_TOKEN_ONE)
     console.log(`检测到已配置Wxpusher的Token，启用一对一推送...`);
 else
     console.log(`检测到未配置Wxpusher的Token，禁用一对一推送...`);
 
 !(async() => {
     var ck="";
     var ptpin ="";
     console.log("==============开始统计每个账号金额=================")
     for (i = 0; i < cookiesArr.length; i++) {
         if (cookiesArr[i]) {
             cookie = cookiesArr[i];
             ptpin = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
             var JoyAmount=await GetJoyRuninginfo(cookie);				
             if (JoyAmount>=duihuanminamt)				
                 runcookiesArr.push(cookie);			
             console.log(ptpin+":"+JoyAmount+"元");
         }
     }
     if (!runcookiesArr){
         console.log("没有符合要求的账号!")
         return
     }
     
     
     console.log("\n\n==============以下共"+runcookiesArr.length+"个账号将进行兑换=================")
     for (i = 0; i < runcookiesArr.length; i++) {
         if (runcookiesArr[i]) {
             ck = runcookiesArr[i];
             console.log(decodeURIComponent(ck.match(/pt_pin=([^; ]+)(?=;?)/) && ck.match(/pt_pin=([^; ]+)(?=;?)/)[1]))
         }
     }
     let nowtime=0;
     if (new Date().getMinutes() == 58) {
         nowtime = new Date().getSeconds();
         sleeptime = (60 - nowtime) * 1000;
         console.log(`请等待时间到达59分` + `等待时间 ${sleeptime / 1000} 秒`);
         await $.wait(sleeptime);
     }
 
     if (new Date().getMinutes() == 59) {
         nowtime = new Date().getSeconds();
         if (nowtime < 59) {
             nowtime = new Date().getSeconds() + 0.95;
             sleeptime = (59 - nowtime) * 1000;
             console.log(`等待时间 ${sleeptime / 1000} 秒`);
             await $.wait(sleeptime);
         }
     }
         
     console.log("\n\n==============开始并发兑换=================")
     for (i = 0; i < runcookiesArr.length; i++) {
         if (runcookiesArr[i]) {
             ck = runcookiesArr[i];
             UserAgent=`jdpingou;iPhone;4.13.0;14.4.2;${randomString(40)};network/wifi;model/iPhone10,2;appBuild/100609;ADID/00000000-0000-0000-0000-000000000000;supportApplePay/1;hasUPPay/0;pushNoticeIsOpen/1;hasOCPay/0;supportBestPay/0;session/${Math.random * 98 + 1};pap/JA2019_3111789;brand/apple;supportJDSHWK/1;Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148`;
             TaskList.push(runJoywithdraw(ck,UserAgent));
             if (i == (runcookiesArr.length - 1) || TaskList.length == maxThread) {
                 await Promise.all(TaskList);
                 TaskList = [];
             }			
         }
     }
     if ($.isNode() && WP_APP_TOKEN_ONE && (success10Arr || success3Arr)) {
         console.log("\n\n==============开始发送通知=================")
         for (i = 0; i < success10Arr.length; i++) {
             if (success10Arr[i]) {
                 ck = success10Arr[i];
                 ptpin = decodeURIComponent(ck.match(/pt_pin=([^; ]+)(?=;?)/) && ck.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
                 if (lntype==1)
                     await notify.sendNotifybyWxPucher("汪汪赛跑兑换红包", `汪汪赛跑兑换10元红包成功，记得过期前在京东特价版使用哦。`, ptpin);
                 else
                     await notify.sendNotifybyWxPucher("汪汪赛跑微信提现", `汪汪赛跑提现10元现金成功，记得过期前在京东特价版使用哦。`, ptpin);
                 await $.wait(1000);
             }
         }
         
         for (i = 0; i < success3Arr.length; i++) {
             if (success3Arr[i]) {
                 ck = success3Arr[i];
                 ptpin = decodeURIComponent(ck.match(/pt_pin=([^; ]+)(?=;?)/) && ck.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
                 if (lntype==1)
                     await notify.sendNotifybyWxPucher("汪汪赛跑兑换红包", `汪汪赛跑兑换3元红包成功，记得过期前在京东特价版使用哦。`, ptpin);
                 else
                     await notify.sendNotifybyWxPucher("汪汪赛跑微信提现", `汪汪赛跑提现3元现金成功，记得过期前在京东特价版使用哦。`, ptpin);
                 await $.wait(1000);
             }
         }
     }
     
     if ($.isNode() && strMessage) {
         await notify.sendNotify("汪汪赛跑兑换红包", strMessage);
     }
     return;
 })()
 .catch((e) => $.logErr(e))
 .finally(() => $.done());
 
 function GetJoyRuninginfo(ck) {
     var JoyRunningAmount=0;
     const headers = {
         "Accept": "application/json, text/plain, */*",
         "Accept-Encoding": "gzip, deflate, br",
         "Accept-Language": "zh-CN,zh-Hans;q=0.9",
         "Connection": "keep-alive",
         "Content-Length": "376",
         "Content-Type": "application/x-www-form-urlencoded",
         "Cookie": ck,
         "Host": "api.m.jd.com",
         "Origin": "https://h5platform.jd.com",
         "Referer": "https://h5platform.jd.com/",
         "User-Agent": `jdpingou;iPhone;4.13.0;14.4.2;${randomString(40)};network/wifi;model/iPhone10,2;appBuild/100609;ADID/00000000-0000-0000-0000-000000000000;supportApplePay/1;hasUPPay/0;pushNoticeIsOpen/1;hasOCPay/0;supportBestPay/0;session/${Math.random * 98 + 1};pap/JA2019_3111789;brand/apple;supportJDSHWK/1;Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148`
         }
     var DateToday = new Date();
     const body = {
         'linkId': 'L-sOanK_5RJCz7I314FpnQ',
         'isFromJoyPark':true,
         'joyLinkId':'LsQNxL7iWDlXUs6cFl-AAg'
     };
     const options = {
         url: `https://api.m.jd.com/?functionId=runningPageHome&body=${encodeURIComponent(JSON.stringify(body))}&t=${DateToday.getTime()}&appid=activities_platform&client=ios&clientVersion=3.9.2`,
         headers,
     }
     return new Promise(resolve => {
         $.get(options, (err, resp, data) => {
             try {
                 if (err) {
                     console.log(`${JSON.stringify(err)}`)
                     console.log(`GetJoyRuninginfo API请求失败，请检查网路重试`)
                 } else {
                     //console.log(`${JSON.stringify(data)}`)
                     if (data) {						
                         data = JSON.parse(data);
                         if (data.data.runningHomeInfo.prizeValue) {
                             JoyRunningAmount=data.data.runningHomeInfo.prizeValue * 1;							
                         }
                     }
                 }				
             } catch (e) {
                 $.logErr(e, resp)
             }   
             finally {
                 resolve(JoyRunningAmount)
             }         
         })
     })
 }
 
 function Joywithdraw(ck,UserAgent,level) {
     //type=1 红包 type=2 提现
     //level=3 10元 ,level=2 3元
     var strresult="";
     const headers = {
         "Accept": "application/json, text/plain, */*",
         "Accept-Encoding": "gzip, deflate, br",
         "Accept-Language": "zh-CN,zh-Hans;q=0.9",
         "Connection": "keep-alive",
         "Content-Length": "376",
         "Content-Type": "application/x-www-form-urlencoded",
         "Cookie": ck,
         "Host": "api.m.jd.com",
         "Origin": "https://h5platform.jd.com",
         "Referer": "https://h5platform.jd.com/",
         "User-Agent": UserAgent
         }
     var DateToday = new Date();
     const body={"linkId":"L-sOanK_5RJCz7I314FpnQ","type":lntype,"level":level};
     const options = {
         url: `https://api.m.jd.com/?functionId=runningPrizeDraw&body=${encodeURIComponent(JSON.stringify(body))}&t=${DateToday.getTime()}&appid=activities_platform&client=ios&clientVersion=3.8.18&cthr=1`,
         headers,
     }
     return new Promise(resolve => {
         $.post(options, (err, resp, data) => {
             try {
                 if (err) {
                     console.log(`${JSON.stringify(err)}`)
                     console.log(`Joywithdraw API请求失败，请检查网路重试`)
                 } else {
                     //console.log(`${JSON.stringify(data)}`)
                     if (data) {						
                         data = JSON.parse(data);
                         if (data.success) 
                             strresult="兑换成功!"						
                         else
                             strresult=data.errMsg
                     }
                 }				
             } catch (e) {
                 $.logErr(e, resp)
             }            
             finally {
                 resolve(strresult)
             }   
         })
     })
 }
 async function runJoywithdraw(ck,UserAgent){
     var pt_pin = decodeURIComponent(ck.match(/pt_pin=([^; ]+)(?=;?)/) && ck.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
     var llsuccess = false;
     var strresult = "";
     var j=0;
     for (j = 0; j < 10; j++) {
         strresult = await Joywithdraw(ck, UserAgent, 3);
         if (strresult == "兑换成功!") {
             console.log(pt_pin +"第" + (j + 1) + "次尝试兑换10元:兑换成功!");
             success10Arr.push(ck);
             strMessage+=pt_pin+"尝试兑换10元:兑换成功!\n"
             llsuccess = true;
         } else
             console.log(pt_pin +"第" + (j + 1) + "次尝试兑换10元:" + strresult);
         
         /* if (strresult.includes("领取过")){
             strMessage+=pt_pin+"尝试兑换10元:"+strresult+"\n"
             llsuccess = true;
         } */
 
         if (llsuccess)
             break;
         
         if (isrun3) {
             strresult = await Joywithdraw(ck, UserAgent, 2);
             if (strresult == "兑换成功!") {
                 console.log(pt_pin + "第" + (j + 1) + "次尝试兑换3元:兑换成功!");
                 strMessage += pt_pin + "尝试兑换3元:兑换成功!\n"
                 success3Arr.push(ck);
                 llsuccess = true;
             } else
                 console.log(pt_pin + "第" + (j + 1) + "次尝试兑换3元:" + strresult);
 
             /* if (strresult.includes("领取过")){
                 strMessage+=pt_pin+"尝试兑换3元:"+strresult+"\n"
                 llsuccess = true;
             } */
 
             if (llsuccess)
                 break;
         }
         
         await $.wait(650);
 
     }
     
             
 }
 function randomString(e) {
     e = e || 32;
     let t = "0123456789abcdef",
     a = t.length,
     n = "";
     for (let i = 0; i < e; i++)
         n += t.charAt(Math.floor(Math.random() * a));
     return n
 }
 
 // prettier-ignore
 function Env(t, e) {
     "undefined" != typeof process && JSON.stringify(process.env).indexOf("GITHUB") > -1 && process.exit(0);
     class s {
         constructor(t) {
             this.env = t
         }
         send(t, e = "GET") {
             t = "string" == typeof t ? {
                 url: t
             }
              : t;
             let s = this.get;
             return "POST" === e && (s = this.post),
             new Promise((e, i) => {
                 s.call(this, t, (t, s, r) => {
                     t ? i(t) : e(s)
                 })
             })
         }
         get(t) {
             return this.send.call(this.env, t)
         }
         post(t) {
             return this.send.call(this.env, t, "POST")
         }
     }
     return new class {
         constructor(t, e) {
             this.name = t,
             this.http = new s(this),
             this.data = null,
             this.dataFile = "box.dat",
             this.logs = [],
             this.isMute = !1,
             this.isNeedRewrite = !1,
             this.logSeparator = "\n",
             this.startTime = (new Date).getTime(),
             Object.assign(this, e),
             this.log("", `🔔${this.name}, 开始!`)
         }
         isNode() {
             return "undefined" != typeof module && !!module.exports
         }
         isQuanX() {
             return "undefined" != typeof $task
         }
         isSurge() {
             return "undefined" != typeof $httpClient && "undefined" == typeof $loon
         }
         isLoon() {
             return "undefined" != typeof $loon
         }
         toObj(t, e = null) {
             try {
                 return JSON.parse(t)
             } catch {
                 return e
             }
         }
         toStr(t, e = null) {
             try {
                 return JSON.stringify(t)
             } catch {
                 return e
             }
         }
         getjson(t, e) {
             let s = e;
             const i = this.getdata(t);
             if (i)
                 try {
                     s = JSON.parse(this.getdata(t))
                 } catch {}
             return s
         }
         setjson(t, e) {
             try {
                 return this.setdata(JSON.stringify(t), e)
             } catch {
                 return !1
             }
         }
         getScript(t) {
             return new Promise(e => {
                 this.get({
                     url: t
                 }, (t, s, i) => e(i))
             })
         }
         runScript(t, e) {
             return new Promise(s => {
                 let i = this.getdata("@chavy_boxjs_userCfgs.httpapi");
                 i = i ? i.replace(/\n/g, "").trim() : i;
                 let r = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");
                 r = r ? 1 * r : 20,
                 r = e && e.timeout ? e.timeout : r;
                 const[o, h] = i.split("@"),
                 n = {
                     url: `http://${h}/v1/scripting/evaluate`,
                     body: {
                         script_text: t,
                         mock_type: "cron",
                         timeout: r
                     },
                     headers: {
                         "X-Key": o,
                         Accept: "*/*"
                     }
                 };
                 this.post(n, (t, e, i) => s(i))
             }).catch(t => this.logErr(t))
         }
         loaddata() {
             if (!this.isNode())
                 return {}; {
                 this.fs = this.fs ? this.fs : require("fs"),
                 this.path = this.path ? this.path : require("path");
                 const t = this.path.resolve(this.dataFile),
                 e = this.path.resolve(process.cwd(), this.dataFile),
                 s = this.fs.existsSync(t),
                 i = !s && this.fs.existsSync(e);
                 if (!s && !i)
                     return {}; {
                     const i = s ? t : e;
                     try {
                         return JSON.parse(this.fs.readFileSync(i))
                     } catch (t) {
                         return {}
                     }
                 }
             }
         }
         writedata() {
             if (this.isNode()) {
                 this.fs = this.fs ? this.fs : require("fs"),
                 this.path = this.path ? this.path : require("path");
                 const t = this.path.resolve(this.dataFile),
                 e = this.path.resolve(process.cwd(), this.dataFile),
                 s = this.fs.existsSync(t),
                 i = !s && this.fs.existsSync(e),
                 r = JSON.stringify(this.data);
                 s ? this.fs.writeFileSync(t, r) : i ? this.fs.writeFileSync(e, r) : this.fs.writeFileSync(t, r)
             }
         }
         lodash_get(t, e, s) {
             const i = e.replace(/\[(\d+)\]/g, ".$1").split(".");
             let r = t;
             for (const t of i)
                 if (r = Object(r)[t], void 0 === r)
                     return s;
             return r
         }
         lodash_set(t, e, s) {
             return Object(t) !== t ? t : (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce((t, s, i) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[i + 1]) >> 0 == +e[i + 1] ? [] : {}, t)[e[e.length - 1]] = s, t)
         }
         getdata(t) {
             let e = this.getval(t);
             if (/^@/.test(t)) {
                 const[, s, i] = /^@(.*?)\.(.*?)$/.exec(t),
                 r = s ? this.getval(s) : "";
                 if (r)
                     try {
                         const t = JSON.parse(r);
                         e = t ? this.lodash_get(t, i, "") : e
                     } catch (t) {
                         e = ""
                     }
             }
             return e
         }
         setdata(t, e) {
             let s = !1;
             if (/^@/.test(e)) {
                 const[, i, r] = /^@(.*?)\.(.*?)$/.exec(e),
                 o = this.getval(i),
                 h = i ? "null" === o ? null : o || "{}" : "{}";
                 try {
                     const e = JSON.parse(h);
                     this.lodash_set(e, r, t),
                     s = this.setval(JSON.stringify(e), i)
                 } catch (e) {
                     const o = {};
                     this.lodash_set(o, r, t),
                     s = this.setval(JSON.stringify(o), i)
                 }
             } else
                 s = this.setval(t, e);
             return s
         }
         getval(t) {
             return this.isSurge() || this.isLoon() ? $persistentStore.read(t) : this.isQuanX() ? $prefs.valueForKey(t) : this.isNode() ? (this.data = this.loaddata(), this.data[t]) : this.data && this.data[t] || null
         }
         setval(t, e) {
             return this.isSurge() || this.isLoon() ? $persistentStore.write(t, e) : this.isQuanX() ? $prefs.setValueForKey(t, e) : this.isNode() ? (this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0) : this.data && this.data[e] || null
         }
         initGotEnv(t) {
             this.got = this.got ? this.got : require("got"),
             this.cktough = this.cktough ? this.cktough : require("tough-cookie"),
             this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar,
             t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar))
         }
         get(t, e = (() => {})) {
             t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"]),
             this.isSurge() || this.isLoon() ? (this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, {
                         "X-Surge-Skip-Scripting": !1
                     })), $httpClient.get(t, (t, s, i) => {
                     !t && s && (s.body = i, s.statusCode = s.status),
                     e(t, s, i)
                 })) : this.isQuanX() ? (this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, {
                         hints: !1
                     })), $task.fetch(t).then(t => {
                     const {
                         statusCode: s,
                         statusCode: i,
                         headers: r,
                         body: o
                     } = t;
                     e(null, {
                         status: s,
                         statusCode: i,
                         headers: r,
                         body: o
                     }, o)
                 }, t => e(t))) : this.isNode() && (this.initGotEnv(t), this.got(t).on("redirect", (t, e) => {
                     try {
                         if (t.headers["set-cookie"]) {
                             const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();
                             s && this.ckjar.setCookieSync(s, null),
                             e.cookieJar = this.ckjar
                         }
                     } catch (t) {
                         this.logErr(t)
                     }
                 }).then(t => {
                     const {
                         statusCode: s,
                         statusCode: i,
                         headers: r,
                         body: o
                     } = t;
                     e(null, {
                         status: s,
                         statusCode: i,
                         headers: r,
                         body: o
                     }, o)
                 }, t => {
                     const {
                         message: s,
                         response: i
                     } = t;
                     e(s, i, i && i.body)
                 }))
         }
         post(t, e = (() => {})) {
             if (t.body && t.headers && !t.headers["Content-Type"] && (t.headers["Content-Type"] = "application/x-www-form-urlencoded"), t.headers && delete t.headers["Content-Length"], this.isSurge() || this.isLoon())
                 this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, {
                         "X-Surge-Skip-Scripting": !1
                     })), $httpClient.post(t, (t, s, i) => {
                     !t && s && (s.body = i, s.statusCode = s.status),
                     e(t, s, i)
                 });
             else if (this.isQuanX())
                 t.method = "POST", this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, {
                         hints: !1
                     })), $task.fetch(t).then(t => {
                     const {
                         statusCode: s,
                         statusCode: i,
                         headers: r,
                         body: o
                     } = t;
                     e(null, {
                         status: s,
                         statusCode: i,
                         headers: r,
                         body: o
                     }, o)
                 }, t => e(t));
             else if (this.isNode()) {
                 this.initGotEnv(t);
                 const {
                     url: s,
                     ...i
                 } = t;
                 this.got.post(s, i).then(t => {
                     const {
                         statusCode: s,
                         statusCode: i,
                         headers: r,
                         body: o
                     } = t;
                     e(null, {
                         status: s,
                         statusCode: i,
                         headers: r,
                         body: o
                     }, o)
                 }, t => {
                     const {
                         message: s,
                         response: i
                     } = t;
                     e(s, i, i && i.body)
                 })
             }
         }
         time(t, e = null) {
             const s = e ? new Date(e) : new Date;
             let i = {
                 "M+": s.getMonth() + 1,
                 "d+": s.getDate(),
                 "H+": s.getHours(),
                 "m+": s.getMinutes(),
                 "s+": s.getSeconds(),
                 "q+": Math.floor((s.getMonth() + 3) / 3),
                 S: s.getMilliseconds()
             };
             /(y+)/.test(t) && (t = t.replace(RegExp.$1, (s.getFullYear() + "").substr(4 - RegExp.$1.length)));
             for (let e in i)
                 new RegExp("(" + e + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? i[e] : ("00" + i[e]).substr(("" + i[e]).length)));
             return t
         }
         msg(e = t, s = "", i = "", r) {
             const o = t => {
                 if (!t)
                     return t;
                 if ("string" == typeof t)
                     return this.isLoon() ? t : this.isQuanX() ? {
                         "open-url": t
                     }
                  : this.isSurge() ? {
                     url: t
                 }
                  : void 0;
                 if ("object" == typeof t) {
                     if (this.isLoon()) {
                         let e = t.openUrl || t.url || t["open-url"],
                         s = t.mediaUrl || t["media-url"];
                         return {
                             openUrl: e,
                             mediaUrl: s
                         }
                     }
                     if (this.isQuanX()) {
                         let e = t["open-url"] || t.url || t.openUrl,
                         s = t["media-url"] || t.mediaUrl;
                         return {
                             "open-url": e,
                             "media-url": s
                         }
                     }
                     if (this.isSurge()) {
                         let e = t.url || t.openUrl || t["open-url"];
                         return {
                             url: e
                         }
                     }
                 }
             };
             if (this.isMute || (this.isSurge() || this.isLoon() ? $notification.post(e, s, i, o(r)) : this.isQuanX() && $notify(e, s, i, o(r))), !this.isMuteLog) {
                 let t = ["", "==============📣系统通知📣=============="];
                 t.push(e),
                 s && t.push(s),
                 i && t.push(i),
                 console.log(t.join("\n")),
                 this.logs = this.logs.concat(t)
             }
         }
         log(...t) {
             t.length > 0 && (this.logs = [...this.logs, ...t]),
             console.log(t.join(this.logSeparator))
         }
         logErr(t, e) {
             const s = !this.isSurge() && !this.isQuanX() && !this.isLoon();
             s ? this.log("", `❗️${this.name}, 错误!`, t.stack) : this.log("", `❗️${this.name}, 错误!`, t)
         }
         wait(t) {
             return new Promise(e => setTimeout(e, t))
         }
         done(t = {}) {
             const e = (new Date).getTime(),
             s = (e - this.startTime) / 1e3;
             this.log("", `🔔${this.name}, 结束! 🕛 ${s} 秒`),
             this.log(),
             (this.isSurge() || this.isQuanX() || this.isLoon()) && $done(t)
         }
     }
     (t, e)
 }
 