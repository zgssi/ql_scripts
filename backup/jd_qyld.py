"""
new Env("PLUS生活权益-KFC");
cron: 0 10,17 * * *
"""

import requests
import sys
import re
import time
import os
import uuid
import urllib.parse
import random
import base64

floorIds = [3003, 3004, 3006, 3007]
beanIds = ["60947948441996"]
activityNames = ["【肯德基】0元享PLUS热爱桶"]


def gettimestamp():
    return str(int(time.time() * 1000))


def printf(text):
    print(text)
    sys.stdout.flush()


def randomstr(num):
    randomstr = ''.join(str(uuid.uuid4()).split('-'))[num:]
    return randomstr


def randomstr1(num):
    randomstr = ""
    for i in range(num):
        randomstr = randomstr + random.choice("abcdefghijklmnopqrstuvwxyz0123456789")
    return randomstr


def base64Encode(string):
    return base64.b64encode(string.encode("utf-8")).decode('utf-8').translate(
        str.maketrans("KLMNOPQRSTABCDEFGHIJUVWXYZabcdopqrstuvwxefghijklmnyz0123456789+/",
                      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"))


def getUA():
    str1 = randomstr(16)
    str2 = randomstr1(16)
    ep = '{"hdid":"JM9F1ywUPwflvMIpYPok0tt5k9kW4ArJEU3lfLhxBqw=","ts":{%s},"ridx":-1,"cipher":{"sv":"CJS=",ad":"{%s}","od":"{%s}","ov":"CzO=","ud":"{%s}"}' % (
        gettimestamp(), base64Encode(str1), base64Encode(str2), base64Encode(str1))
    return 'jdapp;android;10.4.3;;;appBuild/92922;ef/1;ep/%s,"ciphertype":5,"version":"1.2.0",' \
           '"appname":"com.jingdong.app.mall"};jdSupportDarkMode/0;Mozilla/5.0 (Linux; Android 12; Mi 10 ' \
           'Build/SKQ1.211230.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/97.0.4692.98 Mobile ' \
           'Safari/537.36' % urllib.parse.quote(ep)


def getinfo(ck):
    for floorId in floorIds:
        printf(f'开始检索生活权益列表({floorId})')
        try:
            url = f'https://rsp.jd.com/resource/moreLifeRights/v1?lt=m&an=plus.mobile&pageIndex=1&pageSize=1000&floorId={floorId}&provinceId=&cityId=&_={gettimestamp()}'
            headers = {
                "Host": "rsp.jd.com",
                "Connection": "keep-alive",
                "Accept": "application/json, text/plain, */*",
                "User-Agent": getUA(),
                "Origin": "https://plus.m.jd.com",
                "X-Requested-With": "com.jingdong.app.mall",
                "Sec-Fetch-Site": "same-site",
                "Sec-Fetch-Mode": "cors",
                "Sec-Fetch-Dest": "empty",
                "Referer": "https://plus.m.jd.com/",
                "Accept-Encoding": "gzip, deflate, br",
                "Accept-Language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7",
                "Cookie": ck
            }
            r = requests.get(url, headers=headers).json()
            # print(r)
            for i in r['rs']['data']:
                try:
                    if i['jbean'] > 0 and i['rightActivityId'] not in beanIds and i['exchangeType'] != 1:
                        print(i['rightActivityId'],i['title'])
                        beanIds.append(i['rightActivityId'])
                        activityNames.append(i['title'])
                except:
                    pass
            time.sleep(1)
        except:
            printf(f'检索{floorId}时发生错误')
    # print(beanIds)
    # print(activityNames)
    printf('生活权益列表检索完成！\n\n')


def award(ck):
    for i in range(len(activityNames)):
        try:
            printf(f"去领取权益：{activityNames[i]}")
            url = 'https://rsp.jd.com/resource/lifePrivilege/receive/v1?lt=m&an=plus.mobile&uniqueId=%s&_=%s' % (
                beanIds[i], int(time.time() * 1000))
            headers = {
                "Host": "rsp.jd.com",
                "Connection": "keep-alive",
                "Accept": "application/json, text/plain, */*",
                "User-Agent": getUA(),
                "Origin": "https://plus.m.jd.com",
                "X-Requested-With": "com.jingdong.app.mall",
                "Sec-Fetch-Site": "same-site",
                "Sec-Fetch-Mode": "cors",
                "Sec-Fetch-Dest": "empty",
                "Referer": "https://plus.m.jd.com/",
                "Accept-Encoding": "gzip, deflate",
                "Accept-Language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7",
                "Cookie": ck
            }
            r = requests.get(url, headers=headers).json()
            print(f'领取结果：{r["msg"]}\n')
            if r['code'] == '100101' or r['code'] == '100102':
                printf('跳过该账户\n')
                break
            # time.sleep(1)
        except:
            print(f"领取{activityNames[i]}时发生错误")


if __name__ == '__main__':
    try:
        cks = os.environ["JD_COOKIE"].split("&")
    except:
        f = open("/jd/config/config.sh", "r", encoding='utf-8')
        cks = re.findall(r'Cookie[0-9]*="(pt_key=.*?;pt_pin=.*?;)"', f.read())
        f.close()
    # getinfo(cks[0])
    for ck in cks:
        ptpin = re.findall(r"pt_pin=(.*?);", ck)[0]
        printf(f"\n--------开始京东账号{ptpin}--------\n")
        try:
            award(ck)
        except:
            print("发生异常错误")
