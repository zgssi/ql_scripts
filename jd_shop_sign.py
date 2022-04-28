"""
cron: 0 0,22 * * *
new Env('店铺签到');
"""


import requests
import time
import re
import json
import random
import sys
from ql_util import get_random_str
from ql_api import get_envs, disable_env, post_envs, put_envs


# 重写print
def log(*objects, sep=' ', end='\n', file=None, flush=False):
    print(*objects, sep=' ', end='\n', file=None, flush=True)


# 加载cookies
cookies = []
def getCookies():
    cookies_envs = get_envs("JD_COOKIE")
    for envs in cookies_envs:
        if envs.get('status') == 0:
            cookies.extend(envs.get('value').split('&'))
    if len(cookies) <= 0:
        log("请添加环境变量:JD_COOKIE,并查看变量状态!")
        sys.exit()
    # 随机排序
    # random.shuffle(cookies)
    # 去重
    # cookies=set(cookies)
    log('cookies加载成功！共[{0}]个'.format(len(cookies)))
getCookies()


# 加载tokens
tokens = []
token_env = {}
def getTokens():
    global tokens,token_env
    tokens_envs = get_envs("DPQDTK")
    for envs in tokens_envs:
        if envs.get('status') == 0:
            tokens.extend(envs.get('value').split('&'))
    if len(tokens) <= 0:
        log("请添加环境变量:DPQDTK=tk1&tk2...,并查看变量状态!")
        sys.exit()
    # 缓存变量便于修改
    token_env = tokens_envs[0]
    log('本地tokens加载成功！共[{0}]个'.format(len(tokens)))

    if time.localtime().tm_hour != 0:
        log("非0点，开始同步其他大佬仓库脚本tokens")
        log("环境变量:DPQDTK_URLS=url1&url2...")
        log("没必要加太多，每日签到上限[21]个!")
        urls = ['https://cdn.jsdelivr.net/gh/KingRan/KR@main/jd_dpqd.js',
            'https://cdn.jsdelivr.net/gh/6dylan6/jdpro@main/jd_dpsign.js']
        tokens_urls_envs = get_envs("DPQDTK_URLS")
        for envs in tokens_urls_envs:
            if envs.get('status') == 0:
                urls.extend(envs.get('value').split('&'))
        for url in urls:
            log(url)
            res = requests.get(url)
            token_list = re.findall('"(\w{32})"', res.text)
            tokens.extend(token_list)
            log('远程tokens获取成功！共[{0}]个'.format(len(token_list)))

    # 随机排序
    # random.shuffle(tokens)
    # 去重
    tokens = set(tokens)
    log('tokens加载成功！共[{0}]个（去重后）'.format(len(tokens)))
getTokens()


#时间戳
timestamp = str(int(round(time.time() * 1000)))
#UA
UA = "jdapp;iPhone;10.2.2;13.1.2;{0};M/5.0;network/wifi;ADID/;model/iPhone8,1;addressid/2308460611;appBuild/167863;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 13_1_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1;".format(get_random_str(40,True))
#正则
pattern_pin = re.compile(r'pt_pin=([\w\W]*?);')
pattern_data = re.compile(r'\(([\w\W]*?)\)')


# 奖品字典
def prize_dic(prize):
    prize_type = prize["type"]
    prize_discount = int(prize["discount"])
    if prize_type == 1:# 优惠券
        return "[{0}-{1}]优惠券".format(int(prize["quota"]),prize_discount)
    elif prize_type == 4:# 豆豆
        return "[{0}]豆豆".format(prize_discount)
    elif prize_type == 6:# 积分
        return "[{0}]积分".format(prize_discount)
    elif prize_type == 9:# 实物
        for sku in prize["interactPrizeSkuList"]:
            log("实物：{0}".format(sku["skuName"]))
            log("促销价格：{0}".format(sku["promoPrice"]))
            log("京东价格：{0}".format(sku["jdPrice"]))
            log("数量：{0}".format(sku["perMaxNum"]))
        return "[{0}]实物".format(prize_discount)
    elif prize_type == 10:# E卡
        return "[{0}]E卡".format(prize_discount)
    elif prize_type == 14:# 红包
        return "[{0}]红包".format(prize_discount / 100)
    else:# 未知
        log(prize)
        return "[{0}]未知".format(prize_discount)


# 获取活动信息
getActivityInfoDic = {}
def getActivityInfo(token):

    if token in getActivityInfoDic:
        return getActivityInfoDic[token]

    url = "https://api.m.jd.com/api?appid=interCenter_shopSign&t=" + timestamp + "&loginType=2&functionId=interact_center_shopSign_getActivityInfo&body={%22token%22:%22" + token + "%22,%22venderId%22:%22%22}&jsonp=jsonp1000"
    # log(url)

    headers = {
        "accept": "*/*",
        "accept-encoding": "gzip, deflate, br",
        "accept-language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7",
        "cookie": random.choice(cookies).encode(),
        "referer": 'https://h5.m.jd.com/',
        "User-Agent": UA
    }
    # log(headers)

    try:
        res = requests.get(url=url,headers=headers)
        # log(res.text)

        if res.status_code != 200:
            log("status_code:",res.status_code)
            log(res.text)
            return 0,0,0

        re_list = pattern_data.search(res.text)
        data = json.loads(re_list.group(1))
        # log(data)

        if data["code"] == "-1":
            log("限流，1秒后重试...")
            time.sleep(1)
            return getActivityInfo(token)
        elif data["code"] == 402:
            log(data["msg"])
            tokens.remove(token)
            log("移除token")
            return 0,0,0
        elif data["code"] == 200:
            activityId = data["data"]["id"]
            shopId = data["data"]["venderId"]
            if shopId > 0:
                # 获取店铺名称
                shopName = getShopName(shopId)
                log("〖{0}〗".format(shopName))
            discount = 0
            for item in data["data"]["prizeRuleList"]:
                gifts = []
                for prize in item["prizeList"]:
                    gifts.append(prize_dic(prize))
                    if prize["type"] == 4 or prize["type"] == 14 or prize["type"] == 10:#豆豆 或 红包 或 E卡
                        discount += int(prize["discount"]) * (100 if prize["type"] == 10 else 1)
                log("日签{0}天可领取：{1}".format(item["level"],gifts))
            maxLevel = 1
            for item in data["data"]["continuePrizeRuleList"]:
                gifts = []
                for prize in item["prizeList"]:
                    gifts.append(prize_dic(prize))
                    if prize["type"] == 4 or prize["type"] == 14 or prize["type"] == 10:#豆豆 或 红包 或 E卡
                        discount += int(prize["discount"]) * (100 if prize["type"] == 10 else 1)
                        maxLevel = item["level"]
                log("连签{0}天可领取：{1}".format(item["level"],gifts))
            dayRate = round(discount / maxLevel,2)
            log("豆豆+红包={0}，日收益率={1}".format(discount,dayRate))
            getActivityInfoDic[token] = [activityId,shopId,dayRate]
            return activityId,shopId,dayRate
        else:
            log(data)
            return 0,0,0
    except Exception as e:
        log("获取活动信息错误：", str(e))
        return 0,0,0


# 获取店铺名称
getShopNameDic = {}
def getShopName(shopId):

    if shopId in getShopNameDic:
        return getShopNameDic[shopId]

    url = "https://wq.jd.com/mshop/QueryShopMemberInfoJson?venderId={0}".format(shopId)

    headers = {
        "accept": "*/*",
        "accept-encoding": "gzip, deflate, br",
        "accept-language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7",
        # "cookie": cookie.encode(),
        "User-Agent": UA
    }

    try:               
        res = requests.get(url=url,headers=headers)
        # log(res.text)

        data = json.loads(res.text)
        if "shopName" in data:
            shopName = data["shopName"]
        else:
            shopName = ""
        getShopNameDic[shopId] = shopName
        return shopName
    except Exception as e:
        log("获取店铺名称错误：", str(e))
        return ""


# 签到
def signCollectGift(cookie,token,activityId):

    url = "https://api.m.jd.com/api?appid=interCenter_shopSign&t=" + timestamp + "&loginType=2&functionId=interact_center_shopSign_signCollectGift&body={%22token%22:%22" + token + "%22,%22venderId%22:688200,%22activityId%22:" + str(activityId) + ",%22type%22:56,%22actionType%22:7}&jsonp=jsonp1004"
    # log(url)

    headers = {
        "accept": "accept",
        "accept-encoding": "gzip, deflate",
        "accept-language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7",
        "cookie": cookie.encode(),
        "referer": "https://h5.m.jd.com/babelDiy/Zeus/2PAAf74aG3D61qvfKUM5dxUssJQ9/index.html?token=" + token + "&sceneval=2&jxsid=16105853541009626903&cu=true&utm_source=kong&utm_medium=jingfen&utm_campaign=t_1001280291_&utm_term=fa3f8f38c56f44e2b4bfc2f37bce9713",
        "User-Agent": UA
    }

    try:
        res = requests.get(url=url,headers=headers)
        # log(res.text)

        re_list = pattern_data.search(res.text)
        data = json.loads(re_list.group(1))
        # log(data)

        if data["code"] == "-1":
            log("限流，1秒后重试...")
            time.sleep(1)
            return signCollectGift(cookie,token,activityId)
        else:
            # 返回主方法处理
            return data
    except Exception as e:
        log("签到错误：", str(e))
        return None


# 获取签到记录
def getSignRecord(cookie,token,shopId,activityId):

    url = "https://api.m.jd.com/api?appid=interCenter_shopSign&t=" + timestamp + "&loginType=2&functionId=interact_center_shopSign_getSignRecord&body={%22token%22:%22" + token + "%22,%22venderId%22:" + str(shopId) + ",%22activityId%22:" + str(activityId) + ",%22type%22:56}&jsonp=jsonp1006"

    headers = {
        "accept": "application/json",
        "accept-encoding": "gzip, deflate, br",
        "accept-language": "zh-CN,zh;q=0.9",
        "cookie": cookie.encode(),
        "referer": "https://h5.m.jd.com/",
        "User-Agent": UA
    }

    try:
        res = requests.get(url=url,headers=headers)
        # log(res.text)

        re_list = pattern_data.search(res.text)
        data = json.loads(re_list.group(1))
        # log(data)

        if data["code"] == 200:
            log("已连续签到{0}天".format(data["data"]["days"]))
    except Exception as e:
        log("获取签到记录错误：", str(e))


# 加载活动详情
for i,token in enumerate(tokens.copy()):
    log("\n{0}. {1}".format(i + 1,token))
    getActivityInfo(token)
# log(sorted(getActivityInfoDic.items(),key = lambda x:x[1][2],reverse = True))


# 开始签到
for i,cookie in enumerate(cookies):

    pin = pattern_pin.search(cookie).group(1)
    log("\n=====开始【账号{0}】{1}=====".format(i + 1,pin))

    j = 0
    for token,value in sorted(getActivityInfoDic.items(),key = lambda x:x[1][2],reverse = True):
        j += 1
        if time.localtime().tm_hour == 0 and j > 10:
            break
        activityId = value[0]
        shopId = value[1]
        dayRate = value[2]
        log("\n{0}. {1} 日收益率：{2}".format(j,token,dayRate))

        if activityId == 0:
            continue
        
        # 签到
        # time.sleep(1)
        data = signCollectGift(cookie,token,activityId)
        if data is None:
            continue
        elif data["code"] == 200:
            log("签到成功")
            for item in data["data"]:
                for prize in item["prizeList"]:
                    log("获得{0}".format(prize_dic(prize)))
        else:
            if "msg" not in data:
                log(data)
                continue
            msg = data["msg"]
            log(msg)
            
            if "签到用户未登录" in msg:
                log("禁用并结束当前账号")
                # disable_env()
                break
            elif msg == "当前不存在有效的活动!":
                if token in tokens:
                    log("移除token")
                    tokens.remove(token)
                continue
            elif msg == "用户达到签到上限":
                log("结束当前账号")
                break
        
        # 获取签到信息
        # time.sleep(1)
        # getSignRecord(cookie,token,shopId,activityId)

        # break
    # break


# 更新变量
log("\n开始更新店铺签到环境变量")
msg = "有效店铺签到token共[{0}]个".format(len(tokens))
log(msg)
b = put_envs(token_env.get('id'), token_env.get('name'), "&".join(tokens), msg)
log("更新{0}！".format(b))
